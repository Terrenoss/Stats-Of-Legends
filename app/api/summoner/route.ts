import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_PATCH } from '../../../constants';
import type { RiotAccount, RiotSummoner, RiotMatch, LPPoint, HeatmapDay, Teammate, SummonerProfile } from '../../../types';
import {
  fetchRiotAccount,
  fetchSummonerByPuuid,
  fetchMatchIds,
  riotFetchRaw,
  mapWithConcurrency,
  PLATFORM_MAP,
  REGION_ROUTING,
  fetchMatchTimeline,
} from '../../../services/riotService';

function isValidRegion(region: string): region is keyof typeof PLATFORM_MAP {
  return Object.prototype.hasOwnProperty.call(PLATFORM_MAP, region);
}

function isValidNamePart(value: string): boolean {
  if (!value) return false;
  if (value.length > 16) return false;
  return /^[A-Za-z0-9 _.-]+$/.test(value);
}

export async function GET(req: NextRequest) {
  const meta: any = { endpointsCalled: [], errors: [], debugSnapshots: [] };

  try {
    const url = new URL(req.url);
    const rawName = url.searchParams.get('name') || '';
    const rawTag = url.searchParams.get('tag') || '';
    const rawRegion = (url.searchParams.get('region') || 'EUW').toUpperCase();

    if (!rawName) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!isValidRegion(rawRegion)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }
    if (!isValidNamePart(rawName) || (rawTag && !isValidNamePart(rawTag))) {
      return NextResponse.json({ error: 'Invalid summoner name or tag' }, { status: 400 });
    }

    const name = rawName.trim();
    const tag = (rawTag || rawRegion).trim();
    const region = rawRegion;
    const platform = PLATFORM_MAP[region];
    const routing = REGION_ROUTING[region];

    // 1) Account lookup (by riot id)
    let account: RiotAccount | null = null;
    try {
      account = await fetchRiotAccount(name, tag, routing);
      meta.endpointsCalled.push({ endpoint: 'riot/account/v1/accounts/by-riot-id', status: 200 });
      meta.debugSnapshots.push({ step: 'account_parsed', parsedKeys: Object.keys(account || {}) });
    } catch (err: any) {
      const message = String(err?.message || err);
      if (message.includes('RIOT_403')) {
        meta.errors.push({ endpoint: 'riot/account/v1/accounts/by-riot-id', status: 403, message });
        return NextResponse.json(
          {
            error: 'RIOT_FORBIDDEN',
            reason:
              'Riot API returned 403 Forbidden for this request. Vérifie que ta clé est active et que tu utilises bien une clé dev ou personnelle correcte.',
            meta,
          },
          { status: 502 },
        );
      }
      meta.errors.push({ endpoint: 'riot/account/v1/accounts/by-riot-id', status: 'error', message });
      return NextResponse.json({ found: false, meta }, { status: 502 });
    }

    // 2) Summoner by puuid -> summonerId, level
    let summoner: RiotSummoner | null = null;
    try {
      summoner = await fetchSummonerByPuuid(account.puuid, platform);
      meta.endpointsCalled.push({ endpoint: 'lol/summoner/v4/summoners/by-puuid', status: 200 });
      meta.debugSnapshots.push({ step: 'summoner_parsed', parsedKeys: Object.keys(summoner || {}), parsedSnapshot: summoner });
    } catch (err) {
      meta.errors.push({ endpoint: 'lol/summoner/v4/summoners/by-puuid', status: 'error', message: String(err) });
    }

    // 3) League entries by puuid (solo/flex rank)
    let leagueEntries: any[] = [];
    if (account?.puuid) {
      try {
        const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`;
        const lRes = await riotFetchRaw(leagueUrl);
        meta.endpointsCalled.push({ endpoint: leagueUrl, status: lRes.status });
        if (lRes.ok) {
          leagueEntries = JSON.parse(lRes.body || '[]');
        } else {
          meta.errors.push({ endpoint: leagueUrl, status: lRes.status, body: lRes.body });
        }
      } catch (err) {
        meta.errors.push({ endpoint: 'league_by_puuid', status: 'network', message: String(err) });
      }
    }

    const soloEntry = leagueEntries.find((l: any) => l.queueType === 'RANKED_SOLO_5x5');
    const flexEntry = leagueEntries.find((l: any) => l.queueType === 'RANKED_FLEX_SR');

    const rawRank = {
      solo: soloEntry
        ? {
            tier: soloEntry.tier,
            rank: soloEntry.rank,
            leaguePoints: soloEntry.leaguePoints,
            wins: soloEntry.wins,
            losses: soloEntry.losses,
          }
        : { tier: null, rank: null, leaguePoints: null, wins: null, losses: null },
      flex: flexEntry
        ? {
            tier: flexEntry.tier,
            rank: flexEntry.rank,
            leaguePoints: flexEntry.leaguePoints,
            wins: flexEntry.wins,
            losses: flexEntry.losses,
          }
        : { tier: null, rank: null, leaguePoints: null, wins: null, losses: null },
      ladder: { position: null, topPercent: null },
    };

    // 4) Match IDs (history up to 10)
    let matches: any[] = [];
    if (account?.puuid) {
      try {
        const matchIds = await fetchMatchIds(account.puuid, routing, 0, 10);
        meta.endpointsCalled.push({ endpoint: 'lol/match/v5/matches/by-puuid', status: 200, count: matchIds.length });

        const sanitizeChampionKey = (name: string) => {
          if (!name || typeof name !== 'string') return '';
          return name.replace(/[^A-Za-z0-9]/g, '');
        };

        let ddragonItemsMap: Record<string, any> = {};
        try {
          const ddRes = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/data/en_US/item.json`,
          );
          if (ddRes.ok) {
            const ddJson = await ddRes.json();
            if (ddJson && ddJson.data) {
              Object.keys(ddJson.data).forEach((k) => {
                const it = ddJson.data[k];
                ddragonItemsMap[it.image.full.split('.')[0]] = it;
                ddragonItemsMap[it.id] = it;
              });
            }
          }
        } catch {
          // best-effort seulement
        }

        const detailed = await mapWithConcurrency(matchIds, 2, async (matchId) => {
          try {
            const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            const r = await riotFetchRaw(matchUrl);
            meta.endpointsCalled.push({ endpoint: matchUrl, status: r.status });
            if (!r.ok) {
              meta.errors.push({ endpoint: matchUrl, status: r.status, body: r.body });
              return null;
            }

            const mj = JSON.parse(r.body || '{}') as RiotMatch;
            const info = mj.info || ({} as RiotMatch['info']);
            let participants: any[] = info.participants || [];

            participants = participants.map((p: any) => {
              const champName = typeof p.championName === 'string' ? p.championName : p.champion || '';
              const champId = p.championId ?? null;
              const key = sanitizeChampionKey(champName);
              const imageUrl = key
                ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${key}.png`
                : '';

              const totalMinions = Number(p.totalMinionsKilled ?? p.totalMinions ?? 0);
              const neutral = Number(p.neutralMinionsKilled ?? 0);
              const cs =
                (Number.isFinite(totalMinions) ? totalMinions : 0) +
                (Number.isFinite(neutral) ? neutral : 0);

              const level =
                typeof p.champLevel === 'number'
                  ? p.champLevel
                  : typeof p.level === 'number'
                  ? p.level
                  : 0;

              const itemIds: number[] = [];
              for (let ii = 0; ii <= 6; ii++) {
                const k = `item${ii}`;
                const val = (p as any)[k];
                if (val !== undefined && val !== null && Number(val) !== 0) itemIds.push(Number(val));
              }
              const items = itemIds.map((id) => {
                const dd = ddragonItemsMap[String(id)] || null;
                return {
                  id,
                  imageUrl: id
                    ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/${id}.png`
                    : '',
                  name: dd ? dd.name || `Item ${id}` : `Item ${id}`,
                  tags: dd ? dd.tags || [] : [],
                };
              });

              const SPELL_MAP: Record<number, string> = {
                1: 'SummonerBoost',
                3: 'SummonerExhaust',
                4: 'SummonerFlash',
                6: 'SummonerHaste',
                7: 'SummonerHeal',
                11: 'SummonerSmite',
                12: 'SummonerTeleport',
                13: 'SummonerMana',
                14: 'SummonerIgnite',
                21: 'SummonerBarrier',
                32: 'SummonerSnowball',
              };
              const spellsRaw = [p.summoner1Id, p.summoner2Id]
                .filter((v: any) => v !== undefined && v !== null && Number(v) !== 0)
                .map((id: any) => Number(id));
              const spells = spellsRaw.map((id) => ({
                id,
                imageUrl: SPELL_MAP[id]
                  ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/spell/${SPELL_MAP[id]}.png`
                  : '',
              }));

              const championObj = { id: champId, name: champName, imageUrl };

              const safeNumber = (v: any) => (typeof v === 'number' ? v : Number.isFinite(Number(v)) ? Number(v) : 0);

              const safeKills = safeNumber(p.kills ?? 0);
              const safeDeaths = safeNumber(p.deaths ?? 0);
              const safeAssists = safeNumber(p.assists ?? 0);

              const safeSummonerName = p.summonerName || p.summoner || p.name || '';
              const safeTagLine = p.tagLine || p.platformId || '';

              return {
                ...p,
                champion: championObj,
                cs,
                level,
                items,
                spells,
                kills: safeKills,
                deaths: safeDeaths,
                assists: safeAssists,
                summonerName: safeSummonerName,
                tagLine: safeTagLine,
              };
            });

            const me = participants.find((p: any) => p.puuid === account!.puuid) || null;
            if (!me) return null;
            me.summonerName = me.summonerName || account!.gameName || name;
            me.tagLine = me.tagLine || account!.tagLine || tag || region;

            const itemBuild: any[] = [];
            try {
              const frames = (info as any).frames || [];
              const events: any[] = frames.flatMap((f: any) => f.events || []);
              const myEvents = events.filter(
                (e) =>
                  ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type) &&
                  e.participantId === me.participantId,
              );
              myEvents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
              for (const ev of myEvents) {
                const itemId = ev.itemId || ev.itemIdPurchased || ev.itemIdSold || ev.itemIdAdded || null;
                if (!itemId) continue;
                const ts = Math.floor((ev.timestamp || 0) / 1000);
                const mm = Math.floor(ts / 60);
                const ss = ts % 60;
                const timestamp = `${mm}m ${ss}s`;
                const action = ev.type || 'ITEM_PURCHASED';
                let itemName = `Item ${itemId}`;
                let itemTags: string[] = [];
                const ddEntry = ddragonItemsMap[String(itemId)] || null;
                if (ddEntry) {
                  itemName = ddEntry.name || itemName;
                  itemTags = ddEntry.tags || [];
                }
                itemBuild.push({
                  timestamp,
                  action,
                  item: {
                    id: itemId,
                    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/${itemId}.png`,
                    name: itemName,
                    tags: itemTags,
                  },
                });
              }
            } catch {
              // ignore timeline parsing errors
            }

            const queueMap: Record<number, string> = {
              420: 'RANKED_SOLO_5x5',
              440: 'RANKED_FLEX_SR',
              450: 'ARAM',
              400: 'NORMAL_5x5',
            };
            const queueType = queueMap[Number(info.queueId)] || (info?.gameMode ? info.gameMode : 'NORMAL');
            const team = participants
              .filter((p: any) => p.teamId === me.teamId && p.puuid !== account!.puuid)
              .map((p: any) => ({
                summonerName: p.summonerName,
                champion: p.champion?.name || p.championName || '',
                kills: p.kills,
                deaths: p.deaths,
                assists: p.assists,
                win: p.win,
              }));

            try {
              const maxDamage = Math.max(
                ...participants.map((p: any) => Number(p.totalDamageDealtToChampions || 0)),
                1,
              );
              const maxGold = Math.max(...participants.map((p: any) => Number(p.goldEarned || 0)), 1);
              for (const p of participants) {
                const dmgNorm = Number(p.totalDamageDealtToChampions || 0) / maxDamage;
                const kda =
                  (Number(p.kills || 0) + Number(p.assists || 0)) / Math.max(1, Number(p.deaths || 0));
                const kdaNorm = Math.min(kda / 5, 1);
                const visionNorm = Math.min(Number(p.visionScore || 0) / 60, 1);
                const goldNorm = Number(p.goldEarned || 0) / maxGold;
                const raw = dmgNorm * 0.6 + kdaNorm * 0.2 + visionNorm * 0.1 + goldNorm * 0.1;
                (p as any).opScore = Math.round(Math.max(0, Math.min(100, raw * 100)));
              }
            } catch {
              // non critique
            }

            const timelineRes = await riotFetchRaw(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`);
            meta.endpointsCalled.push({ endpoint: `timeline:${matchId}`, status: timelineRes.status });
            let timelineData: any[] | undefined = undefined;
            if (timelineRes.ok) {
              try {
                const timelineJson = JSON.parse(timelineRes.body || '{}');
                const frames = (timelineJson.info?.frames || []) as any[];
                const points: { timestamp: string; blueScore: number; redScore: number }[] = [];
                for (const frame of frames) {
                  const tsMs = frame.timestamp ?? 0;
                  const minutes = Math.round(tsMs / 60000);
                  let blueGold = 0;
                  let redGold = 0;
                  const participantsFrames = frame.participantFrames || {};
                  for (const key of Object.keys(participantsFrames)) {
                    const pf = participantsFrames[key];
                    const teamId = Number(pf.teamId ?? (pf.participantId && pf.participantId <= 5 ? 100 : 200));
                    const totalGold = Number(pf.totalGold ?? pf.gold ?? 0);
                    if (teamId === 100) blueGold += totalGold;
                    else if (teamId === 200) redGold += totalGold;
                  }
                  if (minutes >= 0 && (blueGold > 0 || redGold > 0)) {
                    points.push({
                      timestamp: `${minutes}m`,
                      blueScore: blueGold,
                      redScore: redGold,
                    });
                  }
                }
                if (points.length) timelineData = points;
              } catch (e) {
                meta.errors.push({ endpoint: 'match_timeline_parse', status: 'parse', message: String(e) });
              }
            }

            const championPickBan = (info.teamId === 100 ? participants.filter((p) => p.teamId === 200) : participants.filter((p) => p.teamId === 100)).map((p) => ({
              champion: p.champion?.name || p.championName || '',
              role: p.teamId === 100 ? 'blue' : 'red',
              isBan: p.banStatus === 'BANNED',
            }));

            return {
              id: mj.metadata?.matchId || matchId,
              gameCreation: info.gameStartTimestamp || null,
              gameDuration: info.gameDuration || null,
              gameMode: queueType,
              participants,
              me,
              itemBuild,
              teamMatesSummary: team,
              timelineData,
              championPickBan,
            };
          } catch (err) {
            meta.errors.push({ endpoint: 'match_detail', status: 'network', message: String(err) });
            return null;
          }
        });

        matches = (detailed.filter(Boolean) as any[]).slice(0, 10);
      } catch (err) {
        meta.errors.push({ endpoint: 'matchIds', status: 'network', message: String(err) });
      }
    }

    // 5) Champions aggregation from matches
    const championsPlayedAgg: Record<string, any> = {};
    const heatmapAgg: Record<string, { games: number; wins: number; losses: number }> = {};

    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    for (let i = 119; i >= 0; i--) {
      const d = new Date(now - i * MS_PER_DAY);
      const iso = d.toISOString().slice(0, 10);
      heatmapAgg[iso] = { games: 0, wins: 0, losses: 0 };
    }

    const sortedMatches = [...matches].sort((a, b) => (a.gameCreation || 0) - (b.gameCreation || 0));

    const baseLp = typeof rawRank.solo.leaguePoints === 'number' ? rawRank.solo.leaguePoints : 0;
    let currentLp = baseLp;
    const lpPointsTmp: { ts: number; lp: number }[] = [];

    for (const m of sortedMatches) {
      const champ = m.me?.champion?.name || m.me?.championName || 'Unknown';
      if (!championsPlayedAgg[champ]) {
        championsPlayedAgg[champ] = {
          championName: champ,
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          damage: 0,
        };
      }

      const agg = championsPlayedAgg[champ];
      agg.games += 1;
      agg.wins += m.me?.win ? 1 : 0;
      agg.kills += m.me?.kills || 0;
      agg.deaths += m.me?.deaths || 0;
      agg.assists += m.me?.assists || 0;
      agg.damage += m.me?.totalDamageDealtToChampions || 0;

      const dayKey = new Date(m.gameCreation || 0).toISOString().slice(0, 10);
      if (!heatmapAgg[dayKey]) {
        heatmapAgg[dayKey] = { games: 0, wins: 0, losses: 0 };
      }
      heatmapAgg[dayKey].games += 1;
      if (m.me?.win) heatmapAgg[dayKey].wins += 1;
      else heatmapAgg[dayKey].losses += 1;

      if (m.gameMode === 'RANKED_SOLO_5x5') {
        const delta = m.me?.win ? 15 : -15;
        currentLp -= delta;
        lpPointsTmp.unshift({ ts: m.gameCreation || 0, lp: Math.max(0, currentLp) });
      }
    }

    const champions = Object.values(championsPlayedAgg).map((c: any, idx: number) => ({
      id: idx,
      name: c.championName,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${c.championName.replace(
        /[^A-Za-z0-9]/g,
        '',
      )}.png`,
      games: c.games,
      wins: c.wins,
      losses: c.games - c.wins,
      kda: (c.kills + c.assists) / Math.max(1, c.deaths),
      kills: c.kills,
      deaths: c.deaths,
      assists: c.assists,
      damage: c.damage,
    }));

    // Replace simple lpHistory with typed LPPoint including dates and ranks
    const lpHistory: LPPoint[] = lpPointsTmp.length
      ? lpPointsTmp
          .sort((a, b) => a.ts - b.ts)
          .map((p) => {
            const d = new Date(p.ts);
            return {
              date: d.toISOString(),
              fullDate: d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }),
              lp: p.lp,
              tier: rawRank.solo?.tier || null,
              rank: rawRank.solo?.rank || null,
            };
          })
      : [
          {
            date: new Date().toISOString(),
            fullDate: new Date().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }),
            lp: typeof rawRank.solo.leaguePoints === 'number' ? rawRank.solo.leaguePoints : 0,
            tier: rawRank.solo?.tier || null,
            rank: rawRank.solo?.rank || null,
          },
        ];

    // Convert heatmapAgg into typed HeatmapDay with intensity 0-4
    const heatmap: HeatmapDay[] = Object.entries(heatmapAgg).map(([date, v]) => {
      const games = v.games;
      const wins = v.wins;
      const losses = v.losses;
      const wr = games > 0 ? wins / games : 0;
      let intensity: 0 | 1 | 2 | 3 | 4 = 0;
      if (games === 0) intensity = 0;
      else if (games <= 2 && wr < 0.4) intensity = 1;
      else if (games > 2 && wr < 0.4) intensity = 2;
      else if (games <= 2 && wr >= 0.4) intensity = 3;
      else intensity = 4;
      return { date, games, wins, losses, intensity };
    });

    // Build teammates compatible with Teammate type
    const teammatesMap: Record<string, any> = {};
    for (const m of matches) {
      const team = m.teamMatesSummary || [];
      for (const tm of team) {
        const key = `${tm.summonerName}`;
        if (!teammatesMap[key]) {
          teammatesMap[key] = {
            name: tm.summonerName,
            tag: region,
            profileIconId: 0,
            games: 0,
            wins: 0,
          };
        }
        teammatesMap[key].games += 1;
        if (tm.win) teammatesMap[key].wins += 1;
      }
    }

    const teammates: Teammate[] = Object.values(teammatesMap)
      .map((t: any) => ({
        name: t.name,
        tag: t.tag,
        profileIconId: t.profileIconId,
        games: t.games,
        wins: t.wins,
        losses: t.games - t.wins,
        winrate: t.games > 0 ? Math.round((t.wins / t.games) * 100) : 0,
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);

    // Map rawRank to typed ranks for SummonerProfile
    const soloRank = {
      tier: rawRank.solo?.tier || 'UNRANKED',
      rank: rawRank.solo?.rank || '',
      lp: typeof rawRank.solo.leaguePoints === 'number' ? rawRank.solo.leaguePoints : 0,
      wins: rawRank.solo?.wins || 0,
      losses: rawRank.solo?.losses || 0,
    };

    const flexRank = {
      tier: rawRank.flex?.tier || 'UNRANKED',
      rank: rawRank.flex?.rank || '',
      lp: typeof rawRank.flex.leaguePoints === 'number' ? rawRank.flex.leaguePoints : 0,
      wins: rawRank.flex?.wins || 0,
      losses: rawRank.flex?.losses || 0,
    };

    const profile: SummonerProfile = {
      name: account.gameName,
      tag: account.tagLine,
      level: summoner?.summonerLevel || 0,
      profileIconId: summoner?.profileIconId || 0,
      ranks: {
        solo: soloRank,
        flex: flexRank,
      },
      pastRanks: [],
      ladderRank: 0,
      topPercent: 0,
      lastUpdated: Date.now(),
    };

    // Simple placeholder performance metrics for now (can be improved later)
    const performance = null;

    return NextResponse.json({
      profile,
      matches,
      champions,
      heatmap,
      teammates,
      lpHistory,
      performance,
      meta,
    });
  } catch (e) {
    console.error('[summoner] fatal error', e);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
