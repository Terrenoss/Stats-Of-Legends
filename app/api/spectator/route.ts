import { NextResponse } from 'next/server';
import { SpectatorService } from '@/services/SpectatorService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { gameName, tagLine, region } = SpectatorService.resolveSummoner(searchParams);

  if (!process.env.RIOT_API_KEY) {
    return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
  }

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: 'Missing summoner name or tag' }, { status: 400 });
  }

  try {
    const result = await SpectatorService.getActiveGame(gameName, tagLine, region);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    if (result.noActiveGame) {
      return NextResponse.json({ noActiveGame: true });
    }

    return NextResponse.json(result);

  } catch (e) {
    console.error('[Spectator API Error]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
