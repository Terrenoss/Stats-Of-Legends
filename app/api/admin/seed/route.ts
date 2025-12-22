import { NextResponse } from 'next/server';
import { RiotService } from '@/services/RiotService';

export async function GET(request: Request) {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const tier = searchParams.get('tier'); // IRON, BRONZE...
        const division = searchParams.get('division'); // I, II, III, IV
        const region = searchParams.get('region') || 'euw1'; // Default to euw1

        let entries = [];
        if (tier && division) {
            entries = await RiotService.getLeagueEntries(region, 'RANKED_SOLO_5x5', tier, division, 1);
        } else {
            const league = await RiotService.getChallengerLeague(region);
            entries = league.entries;
        }

        return NextResponse.json({ entries, debug: entries[0] });
    } catch (error: any) {
        console.error("Seed API Error:", error);
        if (error.status === 429) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: 429 });
        }
        return NextResponse.json({ error: `Riot API Error: ${error.message}` }, { status: 500 });
    }
}
