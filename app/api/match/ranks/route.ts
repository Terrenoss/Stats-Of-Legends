import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueEntriesByPuuid, PLATFORM_MAP } from '../../../../services/RiotService';
import { mapWithConcurrency } from '../../../../services/RiotService';
import { prisma } from '../../../../lib/prisma';
import { getAverageRank } from '../../../../utils/rankUtils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { region, puuids, matchId } = body;

        if (!region || !puuids || !Array.isArray(puuids)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const platform = PLATFORM_MAP[region.toUpperCase()];
        if (!platform) {
            return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
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
        const results = await mapWithConcurrency(puuids, 5, fetchRank);

        const rankMap: Record<string, any> = {};
        const allRanks: string[] = [];

        results.forEach((r) => {
            if (r) {
                rankMap[r.puuid] = r;
                if (r.solo) {
                    allRanks.push(`${r.solo.tier} ${r.solo.rank}`);
                }
            }
        });

        if (matchId) {
            const averageRank = getAverageRank(allRanks);
            // Update match in DB asynchronously
            prisma.match.update({
                where: { id: matchId },
                data: { averageRank }
            }).catch(err => console.error('Failed to update match average rank', err));
        }

        return NextResponse.json(rankMap);
    } catch (e) {
        console.error('Error fetching ranks:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
