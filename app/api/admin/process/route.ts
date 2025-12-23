import { NextResponse } from 'next/server';
import { MatchProcessor } from '@/services/MatchProcessor';

export async function POST(request: Request) {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId, region = 'euw1', tier = 'CHALLENGER' } = await request.json();

        const result = await MatchProcessor.processMatch(matchId, region, tier);

        if (result.status === 'skipped') {
            return NextResponse.json({ status: 'skipped' });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        if (error.status === 429) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: 429 });
        }
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
