import { prisma } from '@/lib/prisma';
import {
    fetchRiotAccount,
    fetchSummonerByPuuid,
    fetchLeagueEntriesByPuuid,
    PLATFORM_MAP,
    REGION_ROUTING,
} from './RiotService';
import { RiotAccount, RiotSummoner } from '@/types';
import { LeaderboardService } from './LeaderboardService';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
export const QUEUE_SOLO = 'RANKED_SOLO_5x5';
export const QUEUE_FLEX = 'RANKED_FLEX_SR';


export class SummonerService {

    static isCacheValid(lastFetch: Date | null) {
        if (!lastFetch) return false;
        return (Date.now() - new Date(lastFetch).getTime()) < CACHE_TTL;
    }

    static async getOrUpdateSummoner(name: string, tag: string, region: string, forceUpdate: boolean = false) {
        const platform = PLATFORM_MAP[region];
        const routing = REGION_ROUTING[region];

        // 1. Check DB for Summoner
        let dbSummoner = await prisma.summoner.findUnique({
            where: {
                gameName_tagLine: {
                    gameName: name,
                    tagLine: tag,
                },
            },
            include: {
                ranks: true,
                snapshots: { orderBy: { timestamp: 'asc' } }
            },
        });

        let puuid = dbSummoner?.puuid;
        let account: RiotAccount | null = null;
        let summoner: RiotSummoner | null = null;

        // 2. Ingest/Update Summoner if missing or forced
        // UX CHANGE: Only update if explicitly requested (forceUpdate) or if summoner is new (!dbSummoner)
        const shouldUpdate = !dbSummoner || forceUpdate;

        if (shouldUpdate) {
            try {
                // Fetch Account if we don't have PUUID
                if (!puuid) {
                    account = await fetchRiotAccount(name, tag, routing, 'INTERACTIVE');
                    puuid = account.puuid;
                }

                // Fetch Summoner details
                summoner = await fetchSummonerByPuuid(puuid!, platform, 'INTERACTIVE');

                // Upsert Summoner
                dbSummoner = await prisma.summoner.upsert({
                    where: { puuid: puuid! },
                    update: {
                        gameName: account?.gameName || name,
                        tagLine: account?.tagLine || tag,
                        profileIconId: summoner.profileIconId,
                        summonerLevel: summoner.summonerLevel,
                        accountId: summoner.accountId,
                        summonerId: summoner.id,
                        updatedAt: new Date(),
                        revisionDate: summoner.revisionDate, // Save Riot's revisionDate
                    },
                    create: {
                        puuid: puuid!,
                        gameName: account?.gameName || name,
                        tagLine: account?.tagLine || tag,
                        profileIconId: summoner.profileIconId,
                        summonerLevel: summoner.summonerLevel,
                        accountId: summoner.accountId,
                        summonerId: summoner.id,
                        lastMatchFetch: null,
                        revisionDate: summoner.revisionDate, // Save Riot's revisionDate
                    },
                    include: { ranks: true, snapshots: { orderBy: { timestamp: 'asc' } } },
                });

                // Fetch Ranks
                await this.updateRanks(puuid!, platform, dbSummoner);

                // Refresh dbSummoner after rank update
                dbSummoner = await prisma.summoner.findUnique({
                    where: { puuid: puuid! },
                    include: { ranks: true, snapshots: { orderBy: { timestamp: 'asc' } } }
                });

            } catch (err: any) {
                console.error('Error updating summoner:', err);
                if (!dbSummoner) {
                    throw new Error('Summoner not found or Riot API error: ' + String(err));
                }
            }
        }

        return dbSummoner;
    }

    private static async updateRanks(puuid: string, platform: string, summoner: any) {
        const lRes = await fetchLeagueEntriesByPuuid(puuid, platform, 'INTERACTIVE');

        if (lRes.ok) {
            const leagueEntries = JSON.parse(lRes.body || '[]');

            for (const entry of leagueEntries) {
                if (entry.queueType === QUEUE_SOLO || entry.queueType === QUEUE_FLEX) {
                    const rankValue = LeaderboardService.calculateRankValue(entry.tier, entry.rank, entry.leaguePoints);

                    // Calculate Average Legend Score
                    const matches = await prisma.summonerMatch.findMany({
                        where: { summonerPuuid: puuid, role: { not: 'UNKNOWN' } },
                        select: { legendScore: true },
                        take: 20,
                        orderBy: { match: { gameCreation: 'desc' } }
                    });

                    let legendScore = 0;
                    if (matches.length > 0) {
                        const totalScore = matches.reduce((sum, m) => sum + (m.legendScore || 0), 0);
                        legendScore = totalScore / matches.length;
                    }

                    // 1. Upsert Current Rank with Leaderboard Data
                    await prisma.summonerRank.upsert({
                        where: {
                            summonerPuuid_queueType: {
                                summonerPuuid: puuid,
                                queueType: entry.queueType,
                            },
                        },
                        update: {
                            tier: entry.tier,
                            rank: entry.rank,
                            leaguePoints: entry.leaguePoints,
                            wins: entry.wins,
                            losses: entry.losses,
                            rankValue: rankValue,
                            legendScore: legendScore,
                            updatedAt: new Date(),
                        },
                        create: {
                            summonerPuuid: puuid,
                            queueType: entry.queueType,
                            tier: entry.tier,
                            rank: entry.rank,
                            leaguePoints: entry.leaguePoints,
                            wins: entry.wins,
                            losses: entry.losses,
                            rankValue: rankValue,
                            legendScore: legendScore,
                        },
                    });

                    // 2. Create Snapshot (for history) ONLY if changed
                    try {
                        const lastSnapshot = await prisma.leagueSnapshot.findFirst({
                            where: { summonerPuuid: puuid, queueType: entry.queueType },
                            orderBy: { timestamp: 'desc' }
                        });

                        if (!lastSnapshot ||
                            lastSnapshot.tier !== entry.tier ||
                            lastSnapshot.rank !== entry.rank ||
                            lastSnapshot.leaguePoints !== entry.leaguePoints) {

                            await prisma.leagueSnapshot.create({
                                data: {
                                    summonerPuuid: puuid,
                                    queueType: entry.queueType,
                                    tier: entry.tier,
                                    rank: entry.rank,
                                    leaguePoints: entry.leaguePoints,
                                    wins: entry.wins,
                                    losses: entry.losses,
                                    timestamp: new Date(),
                                }
                            });
                        }
                    } catch (snapErr) {
                        console.error('Failed to create snapshot:', snapErr);
                    }
                }
            }
        }
    }
}
