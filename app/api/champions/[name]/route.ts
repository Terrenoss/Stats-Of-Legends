import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: any) {
    try {
        const params = await props.params;
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role') || 'MID'; // Default to MID or handle 'ALL'
        const rank = searchParams.get('rank') || 'CHALLENGER';
        const championName = params.name;

        // Tier Logic (Same as TierList)
        const TIER_ORDER = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];
        let targetTiers: string[] = [rank];

        if (rank === 'GOLD_PLUS') {
            targetTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf('GOLD') + 1);
        } else if (rank === 'GOLD_MINUS') {
            targetTiers = TIER_ORDER.slice(TIER_ORDER.indexOf('GOLD'));
        } else if (rank === 'PLATINUM_PLUS') {
            targetTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf('PLATINUM') + 1);
        } else if (rank === 'EMERALD_PLUS') {
            targetTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf('EMERALD') + 1);
        } else if (rank === 'DIAMOND_PLUS') {
            targetTiers = TIER_ORDER.slice(0, TIER_ORDER.indexOf('DIAMOND') + 1);
        } else if (rank === 'ALL') {
            targetTiers = TIER_ORDER;
        }

        // Fetch Stats
        const whereClause: any = {
            championId: championName,
            tier: { in: targetTiers }
        };

        if (role && role !== 'ALL') {
            whereClause.role = role;
        } else {
            // If ALL, we want actual roles (TOP, MID, etc.) to aggregate stats.
            // We should exclude 'ALL' role which only contains bans (and 0 matches).
            // Or just fetch everything, since 'ALL' role has 0 matches it won't affect sums.
            // But let's be clean.
            whereClause.role = { not: 'ALL' };
        }

        const stats = await prisma.championStat.findMany({
            where: whereClause
        });

        if (stats.length === 0) {
            return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }

        // Aggregate Deep Stats
        const aggregated = {
            matches: 0,
            wins: 0,
            items: {} as Record<string, { wins: number, matches: number }>,
            runes: {} as Record<string, { wins: number, matches: number }>,
            spells: {} as Record<string, { wins: number, matches: number }>,
        };

        for (const stat of stats) {
            aggregated.matches += stat.matches;
            aggregated.wins += stat.wins;

            // Merge Items
            const items = (stat.items as Record<string, any>) || {};
            Object.entries(items).forEach(([id, data]: [string, any]) => {
                if (!aggregated.items[id]) aggregated.items[id] = { wins: 0, matches: 0 };
                aggregated.items[id].wins += data.wins;
                aggregated.items[id].matches += data.matches;
            });

            // Merge Runes
            const runes = (stat.runes as Record<string, any>) || {};
            Object.entries(runes).forEach(([id, data]: [string, any]) => {
                if (!aggregated.runes[id]) aggregated.runes[id] = { wins: 0, matches: 0 };
                aggregated.runes[id].wins += data.wins;
                aggregated.runes[id].matches += data.matches;
            });

            // Merge Spells
            const spells = (stat.spells as Record<string, any>) || {};
            Object.entries(spells).forEach(([id, data]: [string, any]) => {
                if (!aggregated.spells[id]) aggregated.spells[id] = { wins: 0, matches: 0 };
                aggregated.spells[id].wins += data.wins;
                aggregated.spells[id].matches += data.matches;
            });

            // Merge Skill Order
            const skillOrder = ((stat as any).skillOrder as Record<string, any>) || {};
            Object.entries(skillOrder).forEach(([id, data]: [string, any]) => {
                // Store in items for now or separate?
                // Let's use a separate map for clarity in aggregation, but we need to declare it.
                // Since I can't change the `aggregated` type definition easily in this replace block without changing lines 57-63,
                // I will add it to `items` with a prefix `skill_`? 
                // No, `skillOrder` keys are like "Q-W-E...". `items` keys are IDs or "path_...".
                // It's cleaner to add `skillOrders` to `aggregated` object.
                // I'll assume I can modify the `aggregated` initialization in a separate step or just cast it here.
                if (!(aggregated as any).skillOrders) (aggregated as any).skillOrders = {};
                if (!(aggregated as any).skillOrders[id]) (aggregated as any).skillOrders[id] = { wins: 0, matches: 0 };
                (aggregated as any).skillOrders[id].wins += data.wins;
                (aggregated as any).skillOrders[id].matches += data.matches;
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
        // 1. Get Total Matches for this Tier/Patch
        const totalMatches = await prisma.scannedMatch.count({
            where: { tier: { in: targetTiers } } // Should ideally filter by patch too, but using all scanned for now
        });

        // 2. Fetch Ban Count for this Champion (across all roles)
        const banStat = await prisma.championStat.findFirst({
            where: {
                championId: championName,
                role: 'ALL',
                tier: { in: targetTiers }
            }
        });
        const bans = banStat ? banStat.bans : 0;

        // 3. Calculate Rates
        const winRate = aggregated.matches > 0 ? (aggregated.wins / aggregated.matches) * 100 : 0;
        const pickRate = totalMatches > 0 ? (aggregated.matches / totalMatches) * 100 : 0;
        const banRate = totalMatches > 0 ? (bans / totalMatches) * 100 : 0;

        // 4. Determine Tier
        let calculatedTier: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
        if (winRate >= 53 && pickRate > 1) calculatedTier = 'S+';
        else if (winRate >= 52) calculatedTier = 'S';
        else if (winRate >= 51) calculatedTier = 'A+';
        else if (winRate >= 50) calculatedTier = 'A';
        else if (winRate >= 48) calculatedTier = 'B';
        else if (winRate >= 45) calculatedTier = 'C';
        else calculatedTier = 'D';

        // 5. Extract Core Build (Most Frequent 3-Item Core)
        const coreBuilds = Object.entries(aggregated.items)
            .filter(([key]) => key.startsWith('core_'))
            .map(([key, data]) => ({
                path: key.replace('core_', '').split('-').map(Number),
                wins: data.wins,
                matches: data.matches,
                winRate: (data.wins / data.matches) * 100,
                key: key // Keep key for looking up options
            }))
            .sort((a, b) => b.matches - a.matches);

        const bestCore = coreBuilds.length > 0 ? coreBuilds[0] : null;

        // 5b. Extract Options for Best Core
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
                .slice(0, 5); // Top 5 options

            slot4 = getOptions('slot4');
            slot5 = getOptions('slot5');
            slot6 = getOptions('slot6');
        }

        // 5c. Extract Starting Items
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

        // 6. Extract Skill Orders
        const skillOrders = Object.entries((aggregated as any).skillOrders || {})
            .map(([key, data]: [string, any]) => ({
                path: key,
                wins: data.wins,
                matches: data.matches,
                winRate: (data.wins / data.matches) * 100
            }))
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 3);

        // 6b. Extract Top Skill Path (Array for Grid)
        const topSkillPath = skillOrders.length > 0 ? skillOrders[0].path.split('-') : [];

        // 7. Extract Rune Pages
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

        return NextResponse.json({
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
            itemPaths: coreBuilds, // Return core builds as itemPaths
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
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
