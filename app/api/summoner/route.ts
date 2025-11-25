import { NextRequest, NextResponse } from 'next/server';

const RIOT_KEY = process.env.RIOT_API_KEY;

const PLATFORM_MAP: Record<string, string> = {
  EUW: 'euw1',
  EUNE: 'eun1',
  NA: 'na1',
  KR: 'kr',
  BR: 'br1',
  LAN: 'la1',
};

const REGION_ROUTING: Record<string, string> = {
  EUW: 'europe',
  EUNE: 'europe',
  NA: 'americas',
  BR: 'americas',
  LAN: 'americas',
  KR: 'asia',
};

async function riotFetchRaw(url: string) {
  if (!RIOT_KEY) {
    throw new Error('RIOT_API_KEY is not configured');
  }
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_KEY },
    next: { revalidate: 60 },
  });
  const text = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body: text };
}

async function riotFetchJson(url: string) {
  const { ok, status, body } = await riotFetchRaw(url);
  if (!ok) {
    throw new Error(`RIOT_${status}:${body}`);
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '';
    const tag = url.searchParams.get('tag') || '';
    const region = url.searchParams.get('region') || 'EUW';

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const platform = PLATFORM_MAP[region] || PLATFORM_MAP.EUW;
    const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;

    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag || region)}`;

    const accountRes = await riotFetchRaw(accountUrl);
    if (!accountRes.ok) {
      return NextResponse.json(
        {
          error: `Riot account lookup failed (${accountRes.status}): ${accountRes.body}`,
        },
        { status: 502 },
      );
    }
    const account = JSON.parse(accountRes.body || '{}');

    const defaultRank = { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0 };

    const profile: any = {
      name: account.gameName || name,
      tag: account.tagLine || tag || region,
      level: 0,
      profileIconId: 0,
      ranks: {
        solo: defaultRank,
        flex: defaultRank,
      },
      pastRanks: [],
      ladderRank: 0,
      topPercent: 0,
      lastUpdated: Date.now(),
    };

    let matches: any[] = [];
    let champions: any[] = [];
    let teammates: any[] = [];
    let heatmap: any[] = [];

    try {
      const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`;
      const summoner = await riotFetchJson(summonerUrl);
      profile.level = summoner.summonerLevel || 0;
      profile.profileIconId = summoner.profileIconId || 0;

      const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`;
      const leagues = await riotFetchJson(leagueUrl) as any[];

      const solo = leagues.find(l => l.queueType === 'RANKED_SOLO_5x5');
      const flex = leagues.find(l => l.queueType === 'RANKED_FLEX_SR');

      profile.ranks = {
        solo: solo ? {
          tier: solo.tier,
          rank: solo.rank,
          lp: solo.leaguePoints,
          wins: solo.wins,
          losses: solo.losses,
        } : defaultRank,
        flex: flex ? {
          tier: flex.tier,
          rank: flex.rank,
          lp: flex.leaguePoints,
          wins: flex.wins,
          losses: flex.losses,
        } : defaultRank,
      };

      const matchIdsUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=10`;
      const matchIds: string[] = await riotFetchJson(matchIdsUrl);

      const championsAgg: Record<string, any> = {};
      const teammatesAgg: Record<string, any> = {};

      for (const matchId of matchIds) {
        try {
          const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
          const matchJson = await riotFetchJson(matchUrl);
          const info = matchJson.info;
          const participants: any[] = info.participants || [];

          const me = participants.find(p => p.puuid === account.puuid);
          if (!me) continue;

          const gameId = matchJson.metadata?.matchId || matchId;

          const gameMode = (() => {
            switch (info.queueId) {
              case 420: return 'Ranked Solo/Duo';
              case 440: return 'Ranked Flex';
              case 450: return 'ARAM';
              default: return 'Normal';
            }
          })();

          const formatParticipant = (p: any) => ({
            summonerName: p.riotIdGameName || p.summonerName,
            tagLine: p.riotIdTagline,
            champion: {
              id: p.championId,
              name: p.championName,
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/${info.gameVersion.split('.')[0]}.${info.gameVersion.split('.')[1]}.1/img/champion/${p.championName}.png`,
            },
            teamId: p.teamId,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            cs: p.totalMinionsKilled + p.neutralMinionsKilled,
            win: p.win,
            items: [],
            spells: [],
            visionScore: p.visionScore,
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            goldEarned: p.goldEarned,
            level: p.champLevel,
            rank: undefined,
            opScore: p.challenges?.opScore ?? 0,
          });

          const mappedParticipants = participants.map(formatParticipant);
          const meMapped = mappedParticipants.find(p => p.summonerName === (account.gameName || summoner.name));

          matches.push({
            id: gameId,
            gameCreation: info.gameStartTimestamp,
            gameDuration: info.gameDuration,
            gameMode,
            participants: mappedParticipants,
            me: meMapped,
          });

          const champKey = me.championName;
          if (!championsAgg[champKey]) {
            championsAgg[champKey] = {
              id: me.championId,
              name: me.championName,
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/${info.gameVersion.split('.')[0]}.${info.gameVersion.split('.')[1]}.1/img/champion/${me.championName}.png`,
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
              totalDamageDealtToChampions: 0,
              totalDamageTaken: 0,
              totalCs: 0,
              totalMinutes: 0,
              gd15: 0,
              csd15: 0,
              dmgShare: 0,
            };
          }
          const agg = championsAgg[champKey];
          agg.games += 1;
          if (me.win) agg.wins += 1;
          agg.kills += me.kills;
          agg.deaths += me.deaths;
          agg.assists += me.assists;
          agg.totalDamageDealtToChampions += me.totalDamageDealtToChampions;
          agg.totalDamageTaken += me.totalDamageTaken;
          agg.totalCs += me.totalMinionsKilled + me.neutralMinionsKilled;
          agg.totalMinutes += info.gameDuration / 60;

          const myTeam = participants.filter(p => p.teamId === me.teamId && p.puuid !== account.puuid);
          for (const mate of myTeam) {
            const key = `${mate.riotIdGameName || mate.summonerName}#${mate.riotIdTagline || ''}`;
            if (!teammatesAgg[key]) {
              teammatesAgg[key] = {
                name: mate.riotIdGameName || mate.summonerName,
                tag: mate.riotIdTagline || '',
                profileIconId: mate.profileIcon,
                games: 0,
                wins: 0,
              };
            }
            const t = teammatesAgg[key];
            t.games += 1;
            if (me.win) t.wins += 1;
          }
        } catch (err) {
          console.warn('[riot] failed to fetch match', matchId, err);
        }
      }

      champions = Object.values(championsAgg).map((c: any) => {
        const losses = c.games - c.wins;
        const kda = c.deaths === 0 ? (c.kills + c.assists) : (c.kills + c.assists) / c.deaths;
        const dpm = c.totalMinutes > 0 ? Math.round(c.totalDamageDealtToChampions / c.totalMinutes) : 0;
        const csPerMinute = c.totalMinutes > 0 ? Number((c.totalCs / c.totalMinutes).toFixed(2)) : 0;
        return {
          id: c.id,
          name: c.name,
          imageUrl: c.imageUrl,
          games: c.games,
          wins: c.wins,
          losses,
          kda,
          kills: c.kills,
          deaths: c.deaths,
          assists: c.assists,
          dmgPerMinute: dpm,
          dmgTakenPerMinute: 0,
          csPerMinute,
          gd15: c.gd15,
          csd15: c.csd15,
          dmgPercentage: 0,
        };
      });

      teammates = Object.values(teammatesAgg).map((t: any) => {
        const losses = t.games - t.wins;
        const winrate = t.games > 0 ? Math.round((t.wins / t.games) * 100) : 0;
        return {
          name: t.name,
          tag: t.tag,
          profileIconId: t.profileIconId,
          games: t.games,
          wins: t.wins,
          losses,
          winrate,
        };
      });

      const heatmapMap: Record<string, { games: number; wins: number; losses: number; }> = {};
      for (const m of matches) {
        const d = new Date(m.gameCreation);
        const key = d.toISOString().slice(0, 10);
        if (!heatmapMap[key]) {
          heatmapMap[key] = { games: 0, wins: 0, losses: 0 };
        }
        heatmapMap[key].games += 1;
        if (m.me.win) heatmapMap[key].wins += 1; else heatmapMap[key].losses += 1;
      }
      heatmap = Object.keys(heatmapMap).sort().map(date => {
        const v = heatmapMap[date];
        let intensity: 0 | 1 | 2 | 3 | 4 = 0;
        if (v.games > 0 && v.games <= 2) intensity = 1;
        else if (v.games <= 4) intensity = 2;
        else if (v.games <= 6) intensity = 3;
        else if (v.games > 6) intensity = 4;
        return { date, games: v.games, wins: v.wins, losses: v.losses, intensity };
      });
    } catch (err) {
      console.warn('[riot] partial summary error (summoner/league/matches)', err);
    }

    return NextResponse.json({ profile, matches, heatmap, champions, teammates });
  } catch (err: any) {
    console.error('[riot] summary error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}