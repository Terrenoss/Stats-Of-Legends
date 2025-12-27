import { NextResponse } from 'next/server';
import { MatchProcessor } from '@/services/MatchProcessor';
import { HTTP_TOO_MANY_REQUESTS } from '@/constants/api';

export async function POST(request: Request) {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { matchId, region = 'euw1', tier = 'CHALLENGER' } = await request.json();

        const processingResult = await MatchProcessor.processMatch(matchId, region, tier);

        if (processingResult.status === 'skipped') {
            return NextResponse.json({ status: 'skipped' });
        }

        return NextResponse.json(processingResult);

    } catch (error: any) {
        if (error.status === HTTP_TOO_MANY_REQUESTS) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: HTTP_TOO_MANY_REQUESTS });
        }
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
