import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '@/services/LeaderboardService';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region') || 'EUW1';
    const tier = searchParams.get('tier') || 'ALL';
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const cursorBigInt = cursor ? BigInt(cursor) : undefined;
        const result = await LeaderboardService.getLeaderboard(region, tier, cursorBigInt, limit);

        // Convert BigInt to string for JSON serialization
        const serializedPlayers = result.players.map(p => ({
            ...p,
            rankValue: p.rankValue.toString()
        }));

        return NextResponse.json({
            players: serializedPlayers,
            nextCursor: result.nextCursor ? result.nextCursor.toString() : null,
            totalPlayers: result.totalPlayers
        });
    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
