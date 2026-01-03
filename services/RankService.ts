import { fetchLeagueEntriesByPuuid, PLATFORM_MAP, mapWithConcurrency } from './RiotService';
import { prisma } from '@/lib/prisma';
import { getAverageRank } from '@/utils/rankUtils';

export class RankService {

    static async fetchRanksForPuuids(puuids: string[], region: string) {
        const platform = PLATFORM_MAP[region.toUpperCase()];
        if (!platform) {
            throw new Error('Invalid region');
        }

        const fetchRank = async (puuid: string) => {
            try {
                const res = await fetchLeagueEntriesByPuuid(puuid, platform);
                if (res.ok) {
                    const entries = JSON.parse(res.body || '[]');
                    const solo = entries.find((e: any) => e.queueType === 'RANKED_SOLO_5x5');
                    const flex = entries.find((e: any) => e.queueType === 'RANKED_FLEX_SR');
                    return {
                        puuid,
                        solo: solo ? { tier: solo.tier, rank: solo.rank, lp: solo.leaguePoints } : null,
                        flex: flex ? { tier: flex.tier, rank: flex.rank, lp: flex.leaguePoints } : null,
                    };
                }
                return { puuid, solo: null, flex: null };
            } catch (e) {
                return { puuid, solo: null, flex: null };
            }
        };

        // Fetch with concurrency limit to respect rate limits
        return await mapWithConcurrency(puuids, 5, fetchRank);
    }

    static async updateMatchAverageRank(matchId: string, results: any[]) {
        const allRanks: string[] = [];

        results.forEach((r) => {
            if (r) {
                if (r.solo) {
                    allRanks.push(`${r.solo.tier} ${r.solo.rank}`);
                } else if (r.flex) {
                    allRanks.push(`${r.flex.tier} ${r.flex.rank}`);
                }
            }
        });

        if (allRanks.length > 0) {
            const averageRank = getAverageRank(allRanks);
            // Update match in DB asynchronously
            await prisma.match.update({
                where: { id: matchId },
                data: { averageRank }
            }).catch(err => console.error('Failed to update match average rank', err));
        }
    }
}
