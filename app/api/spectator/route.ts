import { NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

async function riotFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY || '',
    },
    next: { revalidate: 0 }, // No caching for live data
  });
  return res;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const tag = searchParams.get('tag');
  const region = searchParams.get('region') || 'euw1';
  const summonerNameParam = searchParams.get('summoner'); // Fallback for old calls

  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
  }

  // Handle both new (name+tag) and old (summoner=Name-Tag) formats
  let gameName = name;
  let tagLine = tag;

  if (!gameName && summonerNameParam) {
    if (summonerNameParam.includes('-')) {
      [gameName, tagLine] = summonerNameParam.split('-');
    } else {
      gameName = summonerNameParam;
      tagLine = region.toUpperCase(); // Fallback assumption
    }
  }

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: 'Missing summoner name or tag' }, { status: 400 });
  }

  const regionMap: Record<string, string> = {
    'euw': 'euw1',
    'eune': 'eun1',
    'na': 'na1',
    'kr': 'kr',
    'br': 'br1',
    'lan': 'la1',
    'las': 'la2',
    'oce': 'oc1',
    'ru': 'ru',
    'tr': 'tr1',
    'jp': 'jp1',
    'ph': 'ph2',
    'sg': 'sg2',
    'th': 'th2',
    'tw': 'tw2',
    'vn': 'vn2',
  };

  const cleanRegion = region.toLowerCase();
  const routing = regionMap[cleanRegion] || cleanRegion;

  // Regional routing (americas, asia, europe, sea)
  let regionalRouting = 'europe';
  if (['na1', 'br1', 'la1', 'la2'].includes(routing)) regionalRouting = 'americas';
  if (['kr', 'jp1'].includes(routing)) regionalRouting = 'asia';
  if (['ph2', 'sg2', 'th2', 'tw2', 'vn2', 'oc1'].includes(routing)) regionalRouting = 'sea';

  try {
    // 1. Get Account (PUUID)
    const accountUrl = `https://${regionalRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    console.log('[Spectator] Fetching Account:', accountUrl);
    const accountRes = await riotFetch(accountUrl);

    if (!accountRes.ok) {
      console.error('[Spectator] Account Fetch Failed:', accountRes.status, await accountRes.text());
      if (accountRes.status === 404) return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
      return NextResponse.json({ error: 'Riot API Error (Account)' }, { status: accountRes.status });
    }

    const account = await accountRes.json();
    const puuid = account.puuid;
    console.log('[Spectator] Got PUUID:', puuid);

    // 2. Get Active Game (Spectator V5 uses PUUID)
    // Note: User indicated /lol/spectator/v5/active-games/by-summoner/{encryptedPUUID}
    // We skip Summoner V4 as we have PUUID from Account V1.
    const spectatorUrl = `https://${routing}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
    console.log('[Spectator] Fetching Active Game (V5):', spectatorUrl);
    const spectatorRes = await riotFetch(spectatorUrl);

    if (spectatorRes.status === 404) {
      console.log('[Spectator] No Active Game Found (404)');
      return NextResponse.json({ noActiveGame: true });
    }

    if (!spectatorRes.ok) {
      const body = await spectatorRes.text();
      console.error('[Spectator] Spectator Fetch Failed:', spectatorRes.status, body);
      return NextResponse.json({ error: `Riot API Error (Spectator): ${spectatorRes.status} - ${body}` }, { status: spectatorRes.status });
    }

    const gameData = await spectatorRes.json();
    console.log('[Spectator] Raw Participants (Sample):', gameData.participants[0]);

    // 3. Enrich Participants with Ranks (Parallel Fetch)
    // Spectator V5 participants likely have 'puuid' and 'summonerId'.
    // We use 'summonerId' for League V4 if available.

    const participantsWithRanks = await Promise.all(gameData.participants.map(async (p: any) => {
      let rank = 'UNRANKED';
      let summonerId = p.summonerId;
      let displayName = p.riotId ? p.riotId.split('#')[0] : p.summonerName;

      // Fallback: If summonerId or displayName is missing, fetch Summoner V4 by PUUID
      if ((!summonerId || !displayName) && p.puuid) {
        try {
          const sumUrl = `https://${routing}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${p.puuid}`;
          const sumRes = await riotFetch(sumUrl);
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            summonerId = sumData.id;
            if (!displayName) displayName = sumData.name;
          }
        } catch (e) {
          console.error('[Spectator] Failed to fetch summoner fallback:', e);
        }
      }

      if (summonerId) {
        try {
          const leagueUrl = `https://${routing}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
          const leagueRes = await riotFetch(leagueUrl);
          if (leagueRes.ok) {
            const leagues = await leagueRes.json();
            const solo = leagues.find((l: any) => l.queueType === 'RANKED_SOLO_5x5');
            if (solo) {
              rank = `${solo.tier} ${solo.rank}`;
            } else {
              const flex = leagues.find((l: any) => l.queueType === 'RANKED_FLEX_SR');
              if (flex) rank = `${flex.tier} ${flex.rank} (Flex)`;
            }
          }
        } catch (e) {
          // Ignore rank fetch errors
        }
      }

      return {
        ...p,
        summonerName: displayName || 'Unknown', // Ensure we always have a name
        rank
      };
    }));

    // 4. Build Champions Map (Optional optimization, frontend can handle it but backend is safer)
    // We'll just pass the enriched participants back.

    // Fetch DDragon version for champion images if needed, or hardcode/env
    // For now, we return the data structure expected by frontend

    // Get Champion Names for IDs (using latest DDragon)
    const ddragonRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await ddragonRes.json();
    const latest = versions[0];
    const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`);
    const champsJson = await champsRes.json();

    const championsById: Record<number, string> = {};
    Object.values(champsJson.data).forEach((c: any) => {
      championsById[Number(c.key)] = c.id;
    });

    return NextResponse.json({
      ...gameData,
      participants: participantsWithRanks,
      championsById // Send map to frontend
    });

  } catch (e) {
    console.error('[Spectator API Error]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
