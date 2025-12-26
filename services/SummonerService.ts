import { prisma } from '@/lib/prisma';
import {
    fetchRiotAccount,
    fetchSummonerByPuuid,
    fetchLeagueEntriesByPuuid,
    PLATFORM_MAP,
    REGION_ROUTING,
} from './RiotService';
import { RiotAccount, RiotSummoner } from '@/types';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

        // 2. Ingest/Update Summoner if missing, stale, or forced
        const shouldUpdate = !dbSummoner || !this.isCacheValid(dbSummoner.lastMatchFetch) || forceUpdate;

        if (shouldUpdate) {
            try {
                // Fetch Account if we don't have PUUID
                if (!puuid) {
                    account = await fetchRiotAccount(name, tag, routing);
                    puuid = account.puuid;
                }

                // Fetch Summoner details
                summoner = await fetchSummonerByPuuid(puuid!, platform);

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
                    },
                    include: { ranks: true, snapshots: { orderBy: { timestamp: 'asc' } } },
                });

                // Fetch Ranks
                await this.updateRanks(puuid!, platform);

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

    private static async updateRanks(puuid: string, platform: string) {
        const lRes = await fetchLeagueEntriesByPuuid(puuid, platform);

        if (lRes.ok) {
            const leagueEntries = JSON.parse(lRes.body || '[]');

            for (const entry of leagueEntries) {
                if (entry.queueType === 'RANKED_SOLO_5x5' || entry.queueType === 'RANKED_FLEX_SR') {
                    // 1. Upsert Current Rank
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
