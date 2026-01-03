import { prisma } from '@/lib/prisma';
import { RiotService } from './RiotService';
import { ScoringService } from './ScoringService';
import { CURRENT_PATCH } from '@/constants';

// Tier Values for Sorting (Lower is better)
const TIER_VALUES: Record<string, number> = {
    'CHALLENGER': 1,
    'GRANDMASTER': 2,
    'MASTER': 3,
    'DIAMOND': 4,
    'EMERALD': 5,
    'PLATINUM': 6,
    'GOLD': 7,
    'SILVER': 8,
    'BRONZE': 9,
    'IRON': 10
};

const RANK_VALUES: Record<string, number> = {
    'I': 1,
    'II': 2,
    'III': 3,
    'IV': 4
};

export const LeaderboardService = {

    /**
     * Calculates a unique numeric value for sorting players across all tiers.
     * Formula: Tier * 1,000,000 + Rank * 10,000 + (1000 - LP)
     * Result: Lower value = Higher Rank
     */
    calculateRankValue: (tier: string, rank: string, lp: number): bigint => {
        const tierVal = TIER_VALUES[tier] || 99;
        const rankVal = RANK_VALUES[rank] || 5;
        // Invert LP so higher LP = lower rankValue within the same tier/rank
        // Max LP is theoretically infinite for Apex tiers, but practically < 4000
        // For Apex tiers (Master+), Rank is always "I" (1)

        // Base calculation
        let value = BigInt(tierVal) * BigInt(1_000_000) + BigInt(rankVal) * BigInt(10_000);

        // Subtract LP to make higher LP come first (smaller value)
        // We add 5000 to LP to handle negative LP edge cases if any, though LP >= 0 usually.
        // Actually, simple subtraction is fine: 1000 - LP. 
        // If LP is 1500 (Challenger), 1000 - 1500 = -500.
        // If LP is 0, 1000 - 0 = 1000.
        // So 1500 LP < 0 LP in terms of rankValue. Correct.
        value += BigInt(5000 - lp);

        return value;
    },

    getTopChampions: async (puuid: string, championMap: Record<number, string>) => {
        const stats = await prisma.summonerMatch.groupBy({
            by: ['championId'],
            where: { summonerPuuid: puuid },
            _count: { matchId: true },
            orderBy: {
                _count: { matchId: 'desc' }
            },
            take: 3
        });

        // To get winrate, we might need another query or just accept we show count.
        // Let's try to get wins too.
        // We can do a second query for these 3 champs to get wins.
        const topChamps = await Promise.all(stats.map(async (s) => {
            const wins = await prisma.summonerMatch.count({
                where: {
                    summonerPuuid: puuid,
                    championId: s.championId,
                    win: true
                }
            });
            return {
                championName: championMap[s.championId] || 'Unknown',
                count: s._count.matchId,
                winrate: (wins / s._count.matchId) * 100
            };
        }));

        return topChamps;
    },

    /**
     * Fetches the leaderboard with cursor-based pagination.
     */
    getLeaderboard: async (region: string, tier: string = 'ALL', cursor?: bigint, limit: number = 50) => {
        const whereClause: any = {
            queueType: 'RANKED_SOLO_5x5' // Hardcoded for now
        };

        if (tier !== 'ALL') {
            whereClause.tier = tier;
        }

        if (cursor) {
            whereClause.rankValue = { gt: cursor };
        }

        const ranks = await prisma.summonerRank.findMany({
            where: whereClause,
            orderBy: { rankValue: 'asc' },
            take: limit,
            include: { summoner: true }
        });

        const nextCursor = ranks.length === limit ? ranks[ranks.length - 1].rankValue : null;

        // Get total count (cached or approximate)
        // Get total count (cached or approximate)
        const totalPlayers = await prisma.summonerRank.count({
            where: { queueType: 'RANKED_SOLO_5x5' }
        });

        // Fetch Champion Map once
        const championMap = await RiotService.getChampionIdMap(CURRENT_PATCH);

        // Map to LeaderboardEntry format for frontend compatibility
        const players = await Promise.all(ranks.map(async (r) => {
            const topChampions = await LeaderboardService.getTopChampions(r.summonerPuuid, championMap);
            return {
                puuid: r.summonerPuuid,
                summonerName: r.summoner.gameName,
                tagLine: r.summoner.tagLine,
                region: region,
                profileIconId: r.summoner.profileIconId,
                tier: r.tier,
                rank: r.rank,
                lp: r.leaguePoints,
                wins: r.wins,
                losses: r.losses,
                winrate: (r.wins / (r.wins + r.losses)) * 100,
                rankValue: r.rankValue.toString(), // Convert BigInt to string for JSON
                legendScore: r.legendScore,
                topChampions: topChampions
            };
        }));

        return { players, nextCursor, totalPlayers };
    },

    /**
     * Fetches the player and their surrounding neighbors in the leaderboard.
     */
    getSurroundingPlayers: async (region: string, puuid: string) => {
        const playerRank = await prisma.summonerRank.findFirst({
            where: { summonerPuuid: puuid, queueType: 'RANKED_SOLO_5x5' },
            include: { summoner: true }
        });

        if (!playerRank) return null;

        // Get 5 above (lower rankValue)
        const above = await prisma.summonerRank.findMany({
            where: {
                queueType: 'RANKED_SOLO_5x5',
                rankValue: { lt: playerRank.rankValue }
            },
            orderBy: { rankValue: 'desc' }, // Closest to player first
            take: 5,
            include: { summoner: true }
        });

        // Get 5 below (higher rankValue)
        const below = await prisma.summonerRank.findMany({
            where: {
                queueType: 'RANKED_SOLO_5x5',
                rankValue: { gt: playerRank.rankValue }
            },
            orderBy: { rankValue: 'asc' }, // Closest to player first
            take: 5,
            include: { summoner: true }
        });

        // Fetch Champion Map once
        const championMap = await RiotService.getChampionIdMap(CURRENT_PATCH);

        const mapToEntry = async (r: any) => {
            const topChampions = await LeaderboardService.getTopChampions(r.summonerPuuid, championMap);
            return {
                puuid: r.summonerPuuid,
                summonerName: r.summoner.gameName,
                tagLine: r.summoner.tagLine,
                region: region,
                profileIconId: r.summoner.profileIconId,
                tier: r.tier,
                rank: r.rank,
                lp: r.leaguePoints,
                wins: r.wins,
                losses: r.losses,
                winrate: (r.wins / (r.wins + r.losses)) * 100,
                rankValue: r.rankValue.toString(),
                legendScore: r.legendScore,
                topChampions: topChampions
            };
        };

        // Return sorted list: [...above.reverse(), player, ...below]
        const aboveMapped = await Promise.all(above.reverse().map(mapToEntry));
        const playerMapped = await mapToEntry(playerRank);
        const belowMapped = await Promise.all(below.map(mapToEntry));

        return [...aboveMapped, playerMapped, ...belowMapped];
    }
};
