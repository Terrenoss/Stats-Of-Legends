import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '@/services/LeaderboardService';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'EUW1';
    const puuid = searchParams.get('puuid');

    if (!puuid) {
        return NextResponse.json({ error: 'PUUID is required' }, { status: 400 });
    }

    try {
        const players = await LeaderboardService.getSurroundingPlayers(region, puuid);

        if (!players) {
            return NextResponse.json({ error: 'Player not found in leaderboard' }, { status: 404 });
        }

        // Convert BigInt to string for JSON serialization
        const serializedPlayers = players.map(p => ({
            ...p,
            rankValue: p.rankValue.toString()
        }));

        return NextResponse.json({ players: serializedPlayers });
    } catch (error) {
        console.error('Leaderboard Surrounding API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
