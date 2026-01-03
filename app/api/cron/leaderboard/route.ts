import { NextRequest, NextResponse } from 'next/server';
import { LeagueService } from '@/services/LeagueService';

export const maxDuration = 300; // 5 minutes timeout for Vercel/Next.js

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'EUW1';
    const key = searchParams.get('key');

    // Simple security check (optional, but recommended)
    // if (key !== process.env.CRON_SECRET) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        // Trigger the update asynchronously (fire and forget if needed, but here we wait)
        await LeagueService.updateLeaderboard(region);

        return NextResponse.json({ success: true, message: 'Leaderboard update completed' });
    } catch (error) {
        console.error('Leaderboard Cron Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
