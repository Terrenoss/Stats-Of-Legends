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
  const results: U[] = [];
  const executing: Promise<void>[] = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => callback(item));
    results.push(p as unknown as U);
    const e: Promise<void> = p.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
    // Add small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return Promise.all(results);
};

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
    const accountRes = await riotFetch(accountUrl);

    if (!accountRes.ok) {
      console.error('[Spectator] Account Fetch Failed:', accountRes.status, await accountRes.text());
      if (accountRes.status === 404) return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
      return NextResponse.json({ error: 'Riot API Error (Account)' }, { status: accountRes.status });
    }

    const account = await accountRes.json();
    const puuid = account.puuid;

    // 2. Get Active Game (Spectator V5 uses PUUID)
    const spectatorUrl = `https://${routing}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
    const spectatorRes = await riotFetch(spectatorUrl);

    if (spectatorRes.status === 404) {
      return NextResponse.json({ noActiveGame: true });
    }

    if (!spectatorRes.ok) {
      const body = await spectatorRes.text();
      console.error('[Spectator] Spectator Fetch Failed:', spectatorRes.status, body);
      return NextResponse.json({ error: `Riot API Error (Spectator): ${spectatorRes.status} - ${body}` }, { status: spectatorRes.status });
    }

    const gameData = await spectatorRes.json();

    // 3. Enrich Participants with Ranks (Concurrency Limited)
    const participantsWithRanks = await mapWithConcurrency(gameData.participants, 1, async (participant: any) => {
      let rank = 'UNRANKED';
      let summonerId = participant.summonerId;
      let displayName = participant.riotId ? participant.riotId.split('#')[0] : participant.summonerName;

      // 1. Check Cache (DB)
      if (participant.puuid) {
        try {
          const cachedRank = await prisma.summonerRank.findFirst({
            where: {
              summonerPuuid: participant.puuid,
              queueType: 'RANKED_SOLO_5x5',
              updatedAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 24) } // 24h cache
            }
          });

          if (cachedRank) {
            if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(cachedRank.tier)) {
              rank = `${cachedRank.tier} ${cachedRank.leaguePoints} LP`;
            } else {
              rank = `${cachedRank.tier} ${cachedRank.rank}`;
            }
            return {
              ...participant,
              summonerName: displayName || 'Unknown',
              rank
            };
          }
        } catch (e) {
          console.error('[Spectator] Cache check failed:', e);
        }
      }

      // Fallback: If summonerId or displayName is missing, fetch Summoner V4 by PUUID
      if ((!summonerId || !displayName) && participant.puuid) {
        try {
          const sumUrl = `https://${routing}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`;
          const sumRes = await riotFetch(sumUrl);
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            summonerId = sumData.id;
            if (!displayName) displayName = sumData.name;

            // Upsert Summoner to DB to ensure foreign key exists
            try {
              await prisma.summoner.upsert({
                where: { puuid: participant.puuid },
                update: {
                  summonerId: sumData.id,
                  accountId: sumData.accountId,
                  gameName: displayName,
                  tagLine: participant.riotId ? participant.riotId.split('#')[1] : 'EUW', // Fallback tag
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
              // Ignore DB upsert errors (race conditions etc)
            }
          }
        } catch (e) {
          console.error('[Spectator] Failed to fetch summoner fallback:', e);
        }
      }

      // Use PUUID to fetch ranks directly (New Riot API)
      if (participant.puuid) {
        try {
          const leagueUrl = `https://${routing}.api.riotgames.com/lol/league/v4/entries/by-puuid/${participant.puuid}`;
          const leagueRes = await riotFetch(leagueUrl);

          if (leagueRes.ok) {
            const leagues = await leagueRes.json();
            const solo = leagues.find((league: any) => league.queueType === 'RANKED_SOLO_5x5');

            if (solo) {
              // Format Rank
              if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(solo.tier)) {
                rank = `${solo.tier} ${solo.leaguePoints} LP`;
              } else {
                rank = `${solo.tier} ${solo.rank}`;
              }

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
                // Cache write failed silently
              }

            } else {
              const flex = leagues.find((league: any) => league.queueType === 'RANKED_FLEX_SR');
              if (flex) rank = `${flex.tier} ${flex.rank} (Flex)`;
            }
          } else {
            console.error(`[Spectator] Rank fetch failed for ${displayName} (${participant.puuid}): ${leagueRes.status}`);
          }
        } catch (e) {
          console.error('[Spectator] Rank fetch failed for', displayName, e);
        }
      }

      return {
        ...participant,
        summonerName: displayName || 'Unknown',
        rank
      };
    });

    // 4. Build Champions Map
    const latest = CURRENT_PATCH;
    const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`);
    const champsJson = await champsRes.json();

    const championsById: Record<number, string> = {};
    Object.values(champsJson.data).forEach((c: any) => {
      championsById[Number(c.key)] = c.id;
    });

    // Debug missing champions
    gameData.participants.forEach((p: any) => {
      if (!championsById[p.championId]) {
        console.error(`[Spectator] Missing champion ID mapping for: ${p.championId}`);
      }
    });

    // 5. Infer Roles from DB (Tier List Data)
    const championNames = gameData.participants.map((p: any) => championsById[p.championId]);

    // Fetch stats for these champions to find their main role
    // We aggregate matches by role for each champion
    const roleStats = await prisma.championStat.groupBy({
      by: ['championId', 'role'],
      where: {
        championId: { in: championNames }
      },
      _sum: {
        matches: true
      }
    });

    // Map Champion -> Best Role
    const championRoles: Record<string, string> = {};
    const roleCounts: Record<string, number> = {}; // Helper to find max

    roleStats.forEach(stat => {
      const key = stat.championId;
      const count = stat._sum.matches || 0;

      if (!roleCounts[key] || count > roleCounts[key]) {
        roleCounts[key] = count;
        championRoles[key] = stat.role;
      }
    });

    // Assign inferred role to participants
    const participantsWithRoles = participantsWithRanks.map((p: any) => {
      const champName = championsById[p.championId];
      let inferredRole = championRoles[champName] || 'UNKNOWN';

      return {
        ...p,
        inferredRole
      };
    });

    return NextResponse.json({
      ...gameData,
      participants: participantsWithRoles,
      championsById,
      version: latest // Send latest DDragon version to frontend
    });

  } catch (e) {
    console.error('[Spectator API Error]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
