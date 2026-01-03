import { prisma } from '@/lib/prisma';
import { ChampionTier } from '@/types';
import { getTargetTiers } from '@/utils/tierUtils';

export class TierListGenerationService {

    static async getTierList(role: string | null, rank: string): Promise<ChampionTier[]> {
        // Tier Logic
        const targetTiers = getTargetTiers(rank);

        // Construct Where Clause
        const whereClause: any = {
            tier: { in: targetTiers }
        };

        if (role && role !== 'ALL') {
            // If specific role, fetch that role OR 'ALL' (for bans)
            whereClause.OR = [
                { role: role },
                { role: 'ALL' }
            ];
        }
        // If role is ALL or null, we fetch everything (no role filter), which includes 'ALL' role for bans.

        // Fetch stats from DB
        const stats = await prisma.championStat.findMany({
            where: whereClause
        });

        // Get Total Matches for this Tier/Patch (Approximation using ScannedMatch)
        const totalMatches = await prisma.scannedMatch.count({
            where: { tier: { in: targetTiers } }
        });

        // Aggregate Data
        const aggregated = new Map<string, {
            championId: string;
            role: string;
            wins: number;
            matches: number;
            bans: number;
        }>();

        // Helper to get/init
        const getAgg = (key: string, champId: string, r: string) => {
            if (!aggregated.has(key)) {
                aggregated.set(key, { championId: champId, role: r, wins: 0, matches: 0, bans: 0 });
            }
            return aggregated.get(key)!;
        };

        // First pass: Aggregate Bans (from role='ALL') and Stats
        const banCounts = new Map<string, number>();

        for (const stat of stats) {
            if (stat.role === 'ALL') {
                banCounts.set(stat.championId, (banCounts.get(stat.championId) || 0) + stat.bans);
                continue;
            }

            // Filter out if we fetched extra roles (when role != ALL)
            if (role && role !== 'ALL' && stat.role !== role) continue;

            const key = `${stat.championId}_${stat.role}`;
            const curr = getAgg(key, stat.championId, stat.role);
            curr.wins += stat.wins;
            curr.matches += stat.matches;
        }

        // Fetch Matchups for Counters
        const matchups = await prisma.matchupStat.findMany({
            where: {
                tier: { in: targetTiers },
                matches: { gte: 5 } // Minimum matches to be considered a counter
            }
        });

        // Aggregate Matchups
        const matchupMap = new Map<string, Map<string, { wins: number, matches: number }>>();
        for (const m of matchups) {
            const key = `${m.championId}_${m.role}`;
            if (!matchupMap.has(key)) {
                matchupMap.set(key, new Map());
            }
            const champMatchups = matchupMap.get(key)!;

            if (!champMatchups.has(m.opponentId)) {
                champMatchups.set(m.opponentId, { wins: 0, matches: 0 });
            }
            const curr = champMatchups.get(m.opponentId)!;
            curr.wins += m.wins;
            curr.matches += m.matches;
        }

        // Convert to ChampionTier format
        const data: ChampionTier[] = Array.from(aggregated.values())
            .filter(s => s.matches >= 10)
            .map(s => {
                const winRate = s.matches > 0 ? (s.wins / s.matches) * 100 : 0;
                const pickRate = totalMatches > 0 ? (s.matches / totalMatches) * 100 : 0;
                const banRate = totalMatches > 0 ? ((banCounts.get(s.championId) || 0) / totalMatches) * 100 : 0;

                // Determine Tier based on WinRate & PickRate
                let tier: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
                if (winRate >= 53 && pickRate > 1) tier = 'S+';
                else if (winRate >= 52) tier = 'S';
                else if (winRate >= 51) tier = 'A+';
                else if (winRate >= 50) tier = 'A';
                else if (winRate >= 48) tier = 'B';
                else if (winRate >= 45) tier = 'C';
                else tier = 'D';

                // Get Top 3 Counters (Lowest Win Rate)
                const key = `${s.championId}_${s.role}`;
                const champMatchups = matchupMap.get(key);
                let counters: string[] = [];

                if (champMatchups) {
                    counters = Array.from(champMatchups.entries())
                        .map(([oppId, stats]) => ({
                            id: oppId,
                            wr: (stats.wins / stats.matches) * 100
                        }))
                        .sort((a, b) => a.wr - b.wr) // Sort by lowest WR (hardest counters)
                        .slice(0, 3)
                        .map(c => c.id);
                }

                return {
                    id: s.championId,
                    name: s.championId,
                    role: s.role as any,
                    tier: tier,
                    rank: 0,
                    winRate: parseFloat(winRate.toFixed(2)),
                    pickRate: parseFloat(pickRate.toFixed(1)),
                    banRate: parseFloat(banRate.toFixed(1)),
                    trend: 'stable',
                    matches: s.matches,
                    counters: counters
                };
            });

        return data;
    }
}
