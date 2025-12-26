import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CURRENT_PATCH } from '@/constants';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

async function riotFetch(url: string) {
  const response = await fetch(url, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY || '',
    },
    next: { revalidate: 0 }, // No caching for live data
  });
  return response;
}

// Helper for concurrency control
const mapWithConcurrency = async <T, U>(
  array: T[],
  limit: number,
  callback: (item: T) => Promise<U>
): Promise<U[]> => {
  const results: Promise<U>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of array) {
    const p = Promise.resolve().then(() => callback(item));
    results.push(p);

    if (limit <= array.length) {
      const e: Promise<void> = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      }).catch(() => {
        // Catch rejection here to prevent unhandled rejection in the race
        // The error will still be propagated via Promise.all(results)
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
};

async function getRankFromCache(puuid: string) {
  try {
    const cachedRank = await prisma.summonerRank.findFirst({
      where: {
        summonerPuuid: puuid,
        queueType: 'RANKED_SOLO_5x5',
        updatedAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 24) } // 24h cache
      }
    });

    if (cachedRank) {
      if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(cachedRank.tier)) {
        return `${cachedRank.tier} ${cachedRank.leaguePoints} LP`;
      }
      return `${cachedRank.tier} ${cachedRank.rank}`;
    }
  } catch (e) {
    console.warn('[Spectator] Cache check failed:', e);
  }
  return null;
}

async function fetchSummonerFallback(participant: any, routing: string) {
  if (participant.summonerId && (participant.riotId || participant.summonerName)) return null;
  if (!participant.puuid) return null;

  try {
    const sumUrl = `https://${routing}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`;
    const sumRes = await riotFetch(sumUrl);

    if (!sumRes.ok) return null;

    const sumData = await sumRes.json();
    const displayName = sumData.name;

    // Upsert Summoner to DB
    try {
      await prisma.summoner.upsert({
        where: { puuid: participant.puuid },
        update: {
          summonerId: sumData.id,
          accountId: sumData.accountId,
          gameName: displayName,
          tagLine: participant.riotId ? participant.riotId.split('#')[1] : 'EUW',
          profileIconId: sumData.profileIconId,
          summonerLevel: sumData.summonerLevel,
        },
        create: {
          puuid: participant.puuid,
          summonerId: sumData.id,
          accountId: sumData.accountId,
          gameName: displayName,
          tagLine: participant.riotId ? participant.riotId.split('#')[1] : 'EUW',
          profileIconId: sumData.profileIconId,
          summonerLevel: sumData.summonerLevel,
        }
      });
    } catch (dbErr) {
      console.warn('[Spectator] DB Upsert failed:', dbErr);
    }

    return { summonerId: sumData.id, displayName };

  } catch (e) {
    console.error('[Spectator] Failed to fetch summoner fallback:', e);
  }
  return null;
}

async function fetchRankFromRiot(participant: any, routing: string) {
  if (!participant.puuid) return null;

  try {
    const leagueUrl = `https://${routing}.api.riotgames.com/lol/league/v4/entries/by-puuid/${participant.puuid}`;
    const leagueRes = await riotFetch(leagueUrl);

    if (!leagueRes.ok) {
      console.error(`[Spectator] Rank fetch failed: ${leagueRes.status}`);
      return 'UNRANKED';
    }

    const leagues = await leagueRes.json();
    const solo = leagues.find((league: any) => league.queueType === 'RANKED_SOLO_5x5');

    if (solo) {
      // Cache to DB
      try {
        await prisma.summonerRank.upsert({
          where: {
            summonerPuuid_queueType: {
              summonerPuuid: participant.puuid,
              queueType: 'RANKED_SOLO_5x5'
            }
          },
          update: {
            tier: solo.tier,
            rank: solo.rank,
            leaguePoints: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
          },
          create: {
            summonerPuuid: participant.puuid,
            queueType: 'RANKED_SOLO_5x5',
            tier: solo.tier,
            rank: solo.rank,
            leaguePoints: solo.leaguePoints,
            wins: solo.wins,
            losses: solo.losses,
          }
        });
      } catch (cacheErr) {
        console.warn('[Spectator] Rank cache write failed:', cacheErr);
      }

      if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(solo.tier)) {
        return `${solo.tier} ${solo.leaguePoints} LP`;
      }
      return `${solo.tier} ${solo.rank}`;
    }

    const flex = leagues.find((league: any) => league.queueType === 'RANKED_FLEX_SR');
    if (flex) return `${flex.tier} ${flex.rank} (Flex)`;

  } catch (e) {
    console.error('[Spectator] Rank fetch failed:', e);
  }
  return 'UNRANKED';
}

async function enrichParticipant(participant: any, routing: string) {
  let rank = 'UNRANKED';
  let displayName = participant.riotId ? participant.riotId.split('#')[0] : participant.summonerName;

  // 1. Check Cache
  if (participant.puuid) {
    const cached = await getRankFromCache(participant.puuid);
    if (cached) {
      return {
        ...participant,
        summonerName: displayName || 'Unknown',
        rank: cached
      };
    }
  }

  // 2. Fallback for missing info
  const fallback = await fetchSummonerFallback(participant, routing);
  if (fallback) {
    displayName = fallback.displayName;
  }

  // 3. Fetch Rank from Riot
  const riotRank = await fetchRankFromRiot(participant, routing);
  if (riotRank) rank = riotRank;

  return {
    ...participant,
    summonerName: displayName || 'Unknown',
    rank
  };
}

async function getInferredRoles(gameData: any) {
  const latest = CURRENT_PATCH;
  const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`);
  const champsJson = await champsRes.json();

  const championsById: Record<number, string> = {};
  Object.values(champsJson.data).forEach((c: any) => {
    championsById[Number(c.key)] = c.id;
  });

  const championNames = gameData.participants.map((p: any) => championsById[p.championId]);

  const roleStats = await prisma.championStat.groupBy({
    by: ['championId', 'role'],
    where: { championId: { in: championNames } },
    _sum: { matches: true }
  });

  const championRoles: Record<string, string> = {};
  const roleCounts: Record<string, number> = {};

  roleStats.forEach(stat => {
    const key = stat.championId;
    const count = stat._sum.matches || 0;
    if (!roleCounts[key] || count > roleCounts[key]) {
      roleCounts[key] = count;
      championRoles[key] = stat.role;
    }
  });

  return { championsById, championRoles };
}

function resolveSummoner(searchParams: URLSearchParams): { gameName: string | null, tagLine: string | null, region: string } {
  const name = searchParams.get('name');
  const tag = searchParams.get('tag');
  const region = searchParams.get('region') || 'euw1';
  const summonerNameParam = searchParams.get('summoner');

  let gameName = name;
  let tagLine = tag;

  if (!gameName && summonerNameParam) {
    if (summonerNameParam.includes('-')) {
      [gameName, tagLine] = summonerNameParam.split('-');
    } else {
      gameName = summonerNameParam;
      tagLine = region.toUpperCase();
    }
  }
  return { gameName, tagLine, region };
}

function getRegionRouting(region: string) {
  const regionMap: Record<string, string> = {
    'euw': 'euw1', 'eune': 'eun1', 'na': 'na1', 'kr': 'kr', 'br': 'br1',
    'lan': 'la1', 'las': 'la2', 'oce': 'oc1', 'ru': 'ru', 'tr': 'tr1',
    'jp': 'jp1', 'ph': 'ph2', 'sg': 'sg2', 'th': 'th2', 'tw': 'tw2', 'vn': 'vn2',
  };

  const cleanRegion = region.toLowerCase();
  const routing = regionMap[cleanRegion] || cleanRegion;

  let regionalRouting = 'europe';
  if (['na1', 'br1', 'la1', 'la2'].includes(routing)) regionalRouting = 'americas';
  if (['kr', 'jp1'].includes(routing)) regionalRouting = 'asia';
  if (['ph2', 'sg2', 'th2', 'tw2', 'vn2', 'oc1'].includes(routing)) regionalRouting = 'sea';

  return { routing, regionalRouting };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { gameName, tagLine, region } = resolveSummoner(searchParams);

  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
  }

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: 'Missing summoner name or tag' }, { status: 400 });
  }

  const { routing, regionalRouting } = getRegionRouting(region);

  try {
    // 1. Get Account
    const accountUrl = `https://${regionalRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await riotFetch(accountUrl);

    if (!accountRes.ok) {
      if (accountRes.status === 404) return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
      return NextResponse.json({ error: 'Riot API Error (Account)' }, { status: accountRes.status });
    }

    const account = await accountRes.json();
    const puuid = account.puuid;

    // 2. Get Active Game
    const spectatorUrl = `https://${routing}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
    const spectatorRes = await riotFetch(spectatorUrl);

    if (spectatorRes.status === 404) {
      return NextResponse.json({ noActiveGame: true });
    }

    if (!spectatorRes.ok) {
      const body = await spectatorRes.text();
      return NextResponse.json({ error: `Riot API Error (Spectator): ${spectatorRes.status} - ${body}` }, { status: spectatorRes.status });
    }

    const gameData = await spectatorRes.json();

    // 3. Enrich Participants
    const participantsWithRanks = await mapWithConcurrency(gameData.participants, 1, (p) => enrichParticipant(p, routing));

    // 4. Infer Roles
    const { championsById, championRoles } = await getInferredRoles(gameData);

    const participantsWithRoles = participantsWithRanks.map((p: any) => {
      const champName = championsById[p.championId];
      const inferredRole = championRoles[champName] || 'UNKNOWN';
      return { ...p, inferredRole };
    });

    return NextResponse.json({
      ...gameData,
      participants: participantsWithRoles,
      championsById,
      version: CURRENT_PATCH
    });

  } catch (e) {
    console.error('[Spectator API Error]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
