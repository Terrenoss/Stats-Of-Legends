import { prisma } from '@/lib/prisma';
import { getTargetTiers } from '@/utils/tierUtils';
import { Prisma } from '@prisma/client';

interface AggregatedStat {
    wins: number;
    matches: number;
}

interface ItemStat extends AggregatedStat { }
interface RuneStat extends AggregatedStat { }
interface SpellStat extends AggregatedStat { }
interface SkillOrderStat extends AggregatedStat { }


export class ChampionDetailService {
    static async getChampionDetails(championName: string, role: string, rank: string) {
        const targetTiers = getTargetTiers(rank);

        // Fetch Stats
        const whereClause: Prisma.ChampionStatWhereInput = {
            championId: championName,
            tier: { in: targetTiers }
        };

        if (role && role !== 'ALL') {
            whereClause.role = role;
        } else {
            whereClause.role = { not: 'ALL' };
        }

        const stats = await prisma.championStat.findMany({
            where: whereClause
        });

        if (stats.length === 0) {
            return null;
        }

        // Aggregate Deep Stats
        const aggregated = {
            matches: 0,
            wins: 0,
            items: {} as Record<string, ItemStat>,
            runes: {} as Record<string, RuneStat>,
            spells: {} as Record<string, SpellStat>,
            skillOrders: {} as Record<string, SkillOrderStat>
        };

        for (const stat of stats) {
            aggregated.matches += stat.matches;
            aggregated.wins += stat.wins;

            // Merge Items
            const items = (stat.items as unknown as Record<string, ItemStat>) || {};
            Object.entries(items).forEach(([id, data]) => {
                if (!aggregated.items[id]) aggregated.items[id] = { wins: 0, matches: 0 };
                aggregated.items[id].wins += data.wins;
                aggregated.items[id].matches += data.matches;
            });

            // Merge Runes
            const runes = (stat.runes as unknown as Record<string, RuneStat>) || {};
            Object.entries(runes).forEach(([id, data]) => {
                if (!aggregated.runes[id]) aggregated.runes[id] = { wins: 0, matches: 0 };
                aggregated.runes[id].wins += data.wins;
                aggregated.runes[id].matches += data.matches;
            });

            // Merge Spells
            const spells = (stat.spells as unknown as Record<string, SpellStat>) || {};
            Object.entries(spells).forEach(([id, data]) => {
                if (!aggregated.spells[id]) aggregated.spells[id] = { wins: 0, matches: 0 };
                aggregated.spells[id].wins += data.wins;
                aggregated.spells[id].matches += data.matches;
            });

            // Merge Skill Order
            const skillOrder = ((stat.skillOrder as unknown) as Record<string, SkillOrderStat>) || {};
            Object.entries(skillOrder).forEach(([id, data]) => {
                if (!aggregated.skillOrders[id]) aggregated.skillOrders[id] = { wins: 0, matches: 0 };
                aggregated.skillOrders[id].wins += data.wins;
                aggregated.skillOrders[id].matches += data.matches;
            });
        }

        // Fetch Matchups (Counters)
        const matchupWhere: any = {
            championId: championName,
            tier: { in: targetTiers }
        };
        if (role && role !== 'ALL') matchupWhere.role = role;

        const matchups = await prisma.matchupStat.findMany({
            where: matchupWhere
        });

        // Aggregate Matchups
        const aggregatedMatchups = new Map<string, { wins: number, matches: number }>();
        for (const m of matchups) {
            if (!aggregatedMatchups.has(m.opponentId)) {
                aggregatedMatchups.set(m.opponentId, { wins: 0, matches: 0 });
            }
            const curr = aggregatedMatchups.get(m.opponentId)!;
            curr.wins += m.wins;
            curr.matches += m.matches;
        }

        // Fetch Duos
        const duoWhere: any = {
            championId: championName,
            tier: { in: targetTiers }
        };
        if (role && role !== 'ALL') duoWhere.role = role;

        const duos = await prisma.duoStat.findMany({
            where: duoWhere
        });

        // Aggregate Duos
        const aggregatedDuos = new Map<string, { wins: number, matches: number, role: string }>();
        for (const d of duos) {
            const key = `${d.partnerId}_${d.partnerRole}`;
            if (!aggregatedDuos.has(key)) {
                aggregatedDuos.set(key, { wins: 0, matches: 0, role: d.partnerRole });
            }
            const curr = aggregatedDuos.get(key)!;
            curr.wins += d.wins;
            curr.matches += d.matches;
        }

        // Get patch from stats (use the latest one found in the DB for this champ/tier)
        const patch = stats.length > 0 ? stats.sort((a, b) => b.patch.localeCompare(a.patch, undefined, { numeric: true }))[0].patch : 'Unknown';

        // Calculate Metrics (Pick Rate, Ban Rate, Tier)
        const totalMatches = await prisma.scannedMatch.count({
            where: { tier: { in: targetTiers } }
        });

        const banStat = await prisma.championStat.findFirst({
            where: {
                championId: championName,
                role: 'ALL',
                tier: { in: targetTiers }
            }
        });
        const bans = banStat ? banStat.bans : 0;

        const winRate = aggregated.matches > 0 ? (aggregated.wins / aggregated.matches) * 100 : 0;
        const pickRate = totalMatches > 0 ? (aggregated.matches / totalMatches) * 100 : 0;
        const banRate = totalMatches > 0 ? (bans / totalMatches) * 100 : 0;

        let calculatedTier: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
        if (winRate >= 53 && pickRate > 1) calculatedTier = 'S+';
        else if (winRate >= 52) calculatedTier = 'S';
        else if (winRate >= 51) calculatedTier = 'A+';
        else if (winRate >= 50) calculatedTier = 'A';
        else if (winRate >= 48) calculatedTier = 'B';
        else if (winRate >= 45) calculatedTier = 'C';
        else calculatedTier = 'D';

        // Extract Core Build
        const coreBuilds = Object.entries(aggregated.items)
            .filter(([key]) => key.startsWith('core_'))
            .map(([key, data]) => ({
                path: key.replace('core_', '').split('-').map(Number),
                wins: data.wins,
                matches: data.matches,
                winRate: (data.wins / data.matches) * 100,
                key: key
            }))
            .sort((a, b) => b.matches - a.matches);

        const bestCore = coreBuilds.length > 0 ? coreBuilds[0] : null;

        let slot4: any[] = [];
        let slot5: any[] = [];
        let slot6: any[] = [];

        if (bestCore) {
            const getOptions = (slot: string) => Object.entries(aggregated.items)
                .filter(([key]) => key.startsWith(`${bestCore.key}_${slot}_`))
                .map(([key, data]) => ({
                    id: Number(key.split('_').pop()),
                    wins: data.wins,
                    matches: data.matches,
                    winRate: (data.wins / data.matches) * 100
                }))
                .sort((a, b) => b.matches - a.matches)
                .slice(0, 5);

            slot4 = getOptions('slot4');
            slot5 = getOptions('slot5');
            slot6 = getOptions('slot6');
        }

        const startingItems = Object.entries(aggregated.items)
            .filter(([key]) => key.startsWith('start_'))
            .map(([key, data]) => ({
                items: key.replace('start_', '').split('-').map(Number),
                wins: data.wins,
                matches: data.matches,
                winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);

        const skillOrders = Object.entries(aggregated.skillOrders)
            .map(([key, data]) => ({
                path: key,
                wins: data.wins,
                matches: data.matches,
                winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);

        const topSkillPath = skillOrders.length > 0 ? skillOrders[0].path.split('-') : [];

        const runePages = Object.entries(aggregated.runes)
            .filter(([key]) => key.startsWith('page_'))
            .map(([key, data]) => {
                const parts = key.replace('page_', '').split('-');
                const primaryStyle = Number(parts[0]);
                const subStyle = Number(parts[1]);
                const perks = parts.slice(2).map(Number);
                return {
                    primaryStyle,
                    subStyle,
                    perks,
                    wins: data.wins,
                    matches: data.matches,
                    winRate: (data.wins / data.matches) * 100
                };
            })
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);

        return {
            championId: championName,
            role,
            tier: calculatedTier,
            rank: rank,
            patch,
            winRate,
            pickRate,
            banRate,
            totalMatches,
            stats: aggregated,
            itemPaths: coreBuilds,
            startingItems,
            slot4,
            slot5,
            slot6,
            skillOrders,
            topSkillPath,
            runePages,
            matchups: Array.from(aggregatedMatchups.entries()).map(([id, stats]) => ({
                opponentId: id,
                ...stats,
                winRate: (stats.wins / stats.matches) * 100
            })).sort((a, b) => a.winRate - b.winRate),
            duos: Array.from(aggregatedDuos.entries()).map(([key, stats]) => ({
                partnerId: key.split('_')[0],
                partnerRole: stats.role,
                wins: stats.wins,
                matches: stats.matches,
                winRate: (stats.wins / stats.matches) * 100
            })).sort((a, b) => b.matches - a.matches)
        };
    }
}
