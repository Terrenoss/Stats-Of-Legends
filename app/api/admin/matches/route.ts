import { NextResponse } from 'next/server';
import { RiotService } from '@/services/RiotService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const summonerId = searchParams.get('summonerId');
    const puuidParam = searchParams.get('puuid');
    const region = searchParams.get('region') || 'euw1';
    const adminKey = request.headers.get('x-admin-key');

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!summonerId && !puuidParam) {
        return NextResponse.json({ error: 'Missing summonerId or puuid' }, { status: 400 });
    }

    try {
        let targetPuuid = puuidParam;

        // 1. If only summonerId is provided, fetch PUUID
        if (!targetPuuid && summonerId) {
            const summoner = await RiotService.fetchSummonerById(region, summonerId);
            targetPuuid = summoner.puuid;
        }

        // 2. Get Matches
        // Note: RiotService.getMatches needs region routing (europe/americas), not platform (euw1).
        let routing = 'europe';
        if (region.startsWith('na') || region.startsWith('br') || region.startsWith('la')) routing = 'americas';
        if (region.startsWith('kr') || region.startsWith('jp')) routing = 'asia';

        const matches = await RiotService.getMatches(routing, targetPuuid!, 20);

        return NextResponse.json({ matchIds: matches });
    } catch (error: any) {
        if (error.status === 429) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: 429 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
