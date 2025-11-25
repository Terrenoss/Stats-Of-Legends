import { NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Region mapping for Riot API
const REGION_MAP: Record<string, string> = {
  'EUW': 'euw1',
  'NA': 'na1',
  'KR': 'kr',
  'EUNE': 'eun1',
  'BR': 'br1',
  'LAN': 'la1'
};

const REGION_ROUTING_MAP: Record<string, string> = {
    'EUW': 'europe',
    'NA': 'americas',
    'KR': 'asia',
    'EUNE': 'europe',
    'BR': 'americas',
    'LAN': 'americas'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const name = searchParams.get('name');
  const tag = searchParams.get('tag');

  if (!region || !name || !tag) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // If no Riot Key, return 404 so frontend uses mock
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: 'No Riot Key configured' }, { status: 404 });
  }

  try {
    const routing = REGION_ROUTING_MAP[region] || 'europe';
    const platform = REGION_MAP[region] || 'euw1';

    // 1. Get PUUID from Account V1 (Riot ID)
    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    const accountRes = await fetch(accountUrl, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    
    if (!accountRes.ok) throw new Error('Account not found');
    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. Get Summoner Details (Level, Icon)
    const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summonerRes = await fetch(summonerUrl, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const summonerData = await summonerRes.json();

    // 3. Get Rank
    const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`;
    const leagueRes = await fetch(leagueUrl, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const leagueData = await leagueRes.json();

    return NextResponse.json({
      account: accountData,
      summoner: summonerData,
      leagues: leagueData
    });

  } catch (error) {
    console.error('Riot API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Riot' }, { status: 500 });
  }
}