import { NextRequest, NextResponse } from 'next/server';

const RIOT_KEY = process.env.RIOT_API_KEY;

const REGION_ROUTING: Record<string, string> = {
  EUW: 'europe',
  EUNE: 'europe',
  NA: 'americas',
  BR: 'americas',
  LAN: 'americas',
  KR: 'asia',
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || '';
    const region = url.searchParams.get('region') || 'EUW';

    if (!RIOT_KEY) {
      return NextResponse.json({ error: 'RIOT_API_KEY is not configured' }, { status: 500 });
    }

    if (!query.includes('#')) {
      return NextResponse.json({ suggestions: [] });
    }

    const [gameName, tagLine] = query.split('#');
    if (!gameName || !tagLine) {
      return NextResponse.json({ suggestions: [] });
    }

    const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;

    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const resAcc = await fetch(accountUrl, {
      headers: { 'X-Riot-Token': RIOT_KEY },
      next: { revalidate: 30 },
    });

    if (!resAcc.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const acc = await resAcc.json();
    return NextResponse.json({
      suggestions: [
        {
          gameName: acc.gameName,
          tagLine: acc.tagLine,
          puuid: acc.puuid,
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error', suggestions: [] }, { status: 500 });
  }
}

