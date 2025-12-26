import { NextRequest, NextResponse } from 'next/server';
import { RankService } from '../../../../services/RankService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { region, puuids, matchId } = body;

        if (!region || !puuids || !Array.isArray(puuids)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const results = await RankService.fetchRanksForPuuids(puuids, region);

        if (matchId) {
            // Fire and forget update
            RankService.updateMatchAverageRank(matchId, results).catch(console.error);
        }

        const rankMap: Record<string, any> = {};
        results.forEach((r) => {
            if (r) {
                rankMap[r.puuid] = r;
            }
        });

        return NextResponse.json(rankMap);
    } catch (e: any) {
        console.error('Error fetching ranks:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
