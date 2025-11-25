import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_PATCH } from '../../../constants';

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
  return { ok: res.ok, status: res.status, body: text, url };
}

// Simple concurrency limiter for promises
function pMapLimit<T, R>(list: T[], limit: number, mapper: (item: T) => Promise<R>) {
  let i = 0;
  const results: R[] = [] as any;
  return new Promise<R[]>((resolve, _reject) => {
    let active = 0;
    let done = 0;
    const next = () => {
      if (done === list.length) return resolve(results);
      while (active < limit && i < list.length) {
        const idx = i++;
        active++;
        mapper(list[idx])
          .then(r => { results[idx] = r; })
          .catch(() => { results[idx] = null as any; })
          .finally(() => { active--; done++; next(); });
      }
    };
    // handle empty list
    if (list.length === 0) return resolve(results);
    next();
  });
}

export async function GET(req: NextRequest) {
  const meta: any = { endpointsCalled: [], errors: [], debugSnapshots: [] };

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || '';
    const tag = url.searchParams.get('tag') || '';
    const region = (url.searchParams.get('region') || 'EUW').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const platform = PLATFORM_MAP[region] || PLATFORM_MAP.EUW;
    const routing = REGION_ROUTING[region] || REGION_ROUTING.EUW;

    // 1) Account lookup (by riot id) - routing (europe) domain
    const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag || region)}`;
    let account: any = null;
    try {
      const aRes = await riotFetchRaw(accountUrl);
      meta.endpointsCalled.push({ endpoint: accountUrl, status: aRes.status });

      account = JSON.parse(aRes.body || '{}');
      meta.debugSnapshots.push({ step: 'account_parsed', rawLength: aRes.body?.length || 0, parsedKeys: Object.keys(account || {}) });

      if (!aRes.ok) {
        meta.errors.push({ endpoint: accountUrl, status: aRes.status, body: aRes.body });
        return NextResponse.json({ found: false, meta }, { status: 502 });
      }
    } catch (err) {
      meta.errors.push({ endpoint: accountUrl, status: 'network', message: String(err) });
      return NextResponse.json({ found: false, meta }, { status: 502 });
    }

    // 2) Summoner by puuid -> summonerId, level
    const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`;
    let summoner: any = null;
    try {
      const sRes = await riotFetchRaw(summonerUrl);
      meta.endpointsCalled.push({ endpoint: summonerUrl, status: sRes.status });
      summoner = JSON.parse(sRes.body || '{}');
      meta.debugSnapshots.push({ step: 'summoner_parsed', rawLength: sRes.body?.length || 0, parsedKeys: Object.keys(summoner || {}), parsedSnapshot: summoner });

      // fallback by-name handled below if needed
    } catch (err) {
      meta.errors.push({ endpoint: summonerUrl, status: 'network', message: String(err) });
    }

    // If id missing, try fallback by-name (may return 403)
    if (!summoner?.id) {
      try {
        const byNameUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(account.gameName || name)}`;
        const fallbackRes = await riotFetchRaw(byNameUrl);
        meta.endpointsCalled.push({ endpoint: byNameUrl, status: fallbackRes.status, fallback: true });
        if (fallbackRes.ok) {
          const fallbackParsed = JSON.parse(fallbackRes.body || '{}');
          if (fallbackParsed.id) {
            summoner = { ...(summoner || {}), ...fallbackParsed };
            meta.debugSnapshots.push({ step: 'fallback_by_name_success', assignedId: summoner.id });
          }
        } else {
          meta.errors.push({ endpoint: byNameUrl, status: fallbackRes.status, body: fallbackRes.body });
        }
      } catch (fbErr) {
        meta.errors.push({ endpoint: 'fallback_by_name', status: 'network', message: String(fbErr) });
      }
    }

    // 3) Leagues (only if we have summoner.id)
    let leagueEntries: any[] = [];
    if (summoner && summoner.id) {
      try {
        // assign a local variable to convince TypeScript the id exists
        const summonerId = String(summoner.id);
        const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`;
        const lRes = await riotFetchRaw(leagueUrl);
        meta.endpointsCalled.push({ endpoint: leagueUrl, status: lRes.status });
        if (lRes.ok) {
          leagueEntries = JSON.parse(lRes.body || '[]');
        } else {
          meta.errors.push({ endpoint: leagueUrl, status: lRes.status, body: lRes.body });
        }
      } catch (err) {
        meta.errors.push({ endpoint: 'league', status: 'network', message: String(err) });
      }
    }

    const soloEntry = leagueEntries.find((l: any) => l.queueType === 'RANKED_SOLO_5x5');
    const flexEntry = leagueEntries.find((l: any) => l.queueType === 'RANKED_FLEX_SR');

    const defaultRank = { tier: null, rank: null, leaguePoints: null, wins: null, losses: null };
    const rank = {
      solo: soloEntry ? { tier: soloEntry.tier, rank: soloEntry.rank, leaguePoints: soloEntry.leaguePoints, wins: soloEntry.wins, losses: soloEntry.losses } : defaultRank,
      flex: flexEntry ? { tier: flexEntry.tier, rank: flexEntry.rank, leaguePoints: flexEntry.leaguePoints, wins: flexEntry.wins, losses: flexEntry.losses } : defaultRank,
      ladder: { position: null, topPercent: null }
    };

    // 4) Match IDs (match history up to 10)
    let matches: any[] = [];
    if (account?.puuid) {
      try {
        const matchIdsUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=10`;
        const mRes = await riotFetchRaw(matchIdsUrl);
        meta.endpointsCalled.push({ endpoint: matchIdsUrl, status: mRes.status });
        if (mRes.ok) {
          const matchIds = JSON.parse(mRes.body || '[]');
          // fetch details with concurrency limit
          const sanitizeChampionKey = (name: string) => {
            if (!name || typeof name !== 'string') return '';
            // Remove non-alphanumeric characters and spaces to form DataDragon key
            return name.replace(/[^A-Za-z0-9]/g, '');
          };

          // fetch DataDragon items list once to get human-readable names and tags (non-blocking, best-effort)
          let ddragonItemsMap: Record<string, any> = {};
          try {
            const ddRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/data/en_US/item.json`);
            if (ddRes.ok) {
              const ddJson = await ddRes.json();
              if (ddJson && ddJson.data) {
                Object.keys(ddJson.data).forEach(k => { const it = ddJson.data[k]; ddragonItemsMap[it.image.full.split('.')[0]] = it; ddragonItemsMap[it.id] = it; });
              }
            }
          } catch (e) {
            // non-fatal
          }

          const matchFetch = async (matchId: string) => {
            try {
              const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
              const r = await riotFetchRaw(matchUrl);
              meta.endpointsCalled.push({ endpoint: matchUrl, status: r.status });
              if (!r.ok) {
                meta.errors.push({ endpoint: matchUrl, status: r.status, body: r.body });
                return null;
              }
              const mj = JSON.parse(r.body || '{}');
              const info = mj.info || {};
              let participants = info.participants || [];

              // transform participants: add champion object expected by UI
              participants = participants.map((p: any) => {
                const champName = typeof p.championName === 'string' ? p.championName : (p.champion || p.championName || '');
                const champId = p.championId ?? null;
                const key = sanitizeChampionKey(champName);
                const imageUrl = key ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${key}.png` : '';

                // compute CS (minions + neutral) safely
                const totalMinions = Number(p.totalMinionsKilled ?? p.totalMinionsKilled ?? p.totalMinions ?? 0);
                const neutral = Number(p.neutralMinionsKilled ?? 0);
                const cs = (Number.isFinite(totalMinions) ? totalMinions : 0) + (Number.isFinite(neutral) ? neutral : 0);

                // champ level - prefer champLevel when numeric
                const level = (typeof p.champLevel === 'number') ? p.champLevel : (typeof p.champLevel === 'number' ? p.champLevel : (typeof p.level === 'number' ? p.level : 0));

                // items from item0..item6 (ensure array always exists)
                const itemIds: number[] = [];
                for (let ii = 0; ii <= 6; ii++) {
                  const k = `item${ii}`;
                  const val = (p as any)[k];
                  // treat 0/null/undefined as no-item
                  if (val !== undefined && val !== null && Number(val) !== 0) itemIds.push(Number(val));
                }
                const items = itemIds.map(id => {
                  const dd = ddragonItemsMap[String(id)] || null;
                  return {
                    id,
                    imageUrl: id ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/${id}.png` : '',
                    name: dd ? (dd.name || `Item ${id}`) : `Item ${id}`,
                    tags: dd ? (dd.tags || []) : []
                  };
                });

                // spells mapping (common summoner spells)
                const SPELL_MAP: Record<number, string> = {4: 'SummonerFlash',14: 'SummonerIgnite',11: 'SummonerSmite',3: 'SummonerExhaust',6: 'SummonerHaste',7: 'SummonerHeal',21: 'SummonerBarrier',1: 'SummonerBoost',13: 'SummonerMana',32: 'SummonerSnowball', 12: 'SummonerTeleport'};
                const spellsRaw = [p.summoner1Id, p.summoner2Id].filter((v: any) => v !== undefined && v !== null && Number(v) !== 0).map((id: any) => Number(id));
                const spells = spellsRaw.map(id => ({ id, imageUrl: SPELL_MAP[id] ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/spell/${SPELL_MAP[id]}.png` : '' }));

                // ensure champion object is always present to avoid frontend errors
                const championObj = { id: champId, name: champName, imageUrl };

                // ensure numeric basics exist to avoid NaN in frontend
                const safeNumber = (v: any) => (typeof v === 'number' ? v : (Number.isFinite(Number(v)) ? Number(v) : 0));

                const safeKills = safeNumber(p.kills ?? p.kills ?? 0);
                const safeDeaths = safeNumber(p.deaths ?? p.deaths ?? 0);
                const safeAssists = safeNumber(p.assists ?? p.assists ?? 0);

                // Ensure summonerName and tagLine always exist (avoid 'Unranked' because of missing name)
                const safeSummonerName = p.summonerName || p.summoner || (p.name || '') || '';
                const safeTagLine = (p.tagLine || p.platformId || '') || '';

                return { ...p, champion: championObj, cs, level, items, spells, kills: safeKills, deaths: safeDeaths, assists: safeAssists, summonerName: safeSummonerName, tagLine: safeTagLine };
              });

              const me = participants.find((p: any) => p.puuid === account.puuid) || null;
              // if me found, ensure it has summonerName/tagLine
              if (me) {
                me.summonerName = me.summonerName || account.gameName || name;
                me.tagLine = me.tagLine || account.tagLine || tag || region;
              }
              if (!me) return null;

              // Build item purchase timeline for the player from frames events if available
              const itemBuild: any[] = [];
              try {
                const frames = info.frames || [];
                const events: any[] = frames.flatMap((f: any) => (f.events || []));
                // include purchases, sells and undo actions to have a full build path
                const myEvents = events.filter(e => ['ITEM_PURCHASED','ITEM_SOLD','ITEM_UNDO'].includes(e.type) && e.participantId === me.participantId);
                myEvents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                for (const ev of myEvents) {
                  const itemId = ev.itemId || ev.itemIdPurchased || ev.itemIdSold || ev.itemIdAdded || null;
                  if (!itemId) continue;
                  const ts = Math.floor((ev.timestamp || 0) / 1000);
                  const mm = Math.floor(ts / 60);
                  const ss = ts % 60;
                  const timestamp = `${mm}m ${ss}s`;
                  const action = ev.type || 'ITEM_PURCHASED';
                  // try to lookup item metadata from ddragon map
                  let itemName = `Item ${itemId}`;
                  let itemTags: string[] = [];
                  const ddEntry = ddragonItemsMap[String(itemId)] || ddragonItemsMap[String(itemId)]?.data || null;
                  if (ddEntry) {
                    itemName = ddEntry.name || itemName;
                    itemTags = ddEntry.tags || [];
                  }
                  itemBuild.push({ timestamp, action, item: { id: itemId, imageUrl: `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/${itemId}.png`, name: itemName, tags: itemTags } });
                }
              } catch (e) {
                // ignore timeline parsing errors
              }

              const queueMap: Record<number, string> = { 420: 'RANKED_SOLO_5x5', 440: 'RANKED_FLEX_SR', 450: 'ARAM', 400: 'NORMAL_5x5' };
              const queueType = queueMap[Number(info.queueId)] || (info?.gameMode ? info.gameMode : 'NORMAL');
              const team = participants
                .filter((p: any) => p.teamId === me.teamId && p.puuid !== account.puuid)
                .map((p: any) => ({ summonerName: p.summonerName, champion: p.champion?.name || p.championName || '', kills: p.kills, deaths: p.deaths, assists: p.assists, win: p.win }));

              // ---- compute deterministic opScore for every participant to allow reliable MVP/ACE selection ----
              try {
                const maxDamage = Math.max(...participants.map((p: any) => Number(p.totalDamageDealtToChampions || 0)), 1);
                const maxGold = Math.max(...participants.map((p: any) => Number(p.goldEarned || 0)), 1);
                for (const p of participants) {
                  const dmgNorm = (Number(p.totalDamageDealtToChampions || 0)) / maxDamage;
                  const kda = (Number(p.kills || 0) + Number(p.assists || 0)) / Math.max(1, Number(p.deaths || 0));
                  const kdaNorm = Math.min(kda / 5, 1); // cap at 5:1
                  const visionNorm = Math.min(Number(p.visionScore || 0) / 60, 1);
                  const goldNorm = Number(p.goldEarned || 0) / maxGold;
                  const raw = (dmgNorm * 0.6) + (kdaNorm * 0.2) + (visionNorm * 0.1) + (goldNorm * 0.1);
                  p.opScore = Math.round(Math.max(0, Math.min(100, raw * 100)));
                }
              } catch (e) {
                // non critical - opScore remain undefined if calculation fails
              }

              return {
                id: mj.metadata?.matchId || matchId,
                gameCreation: info.gameStartTimestamp || null,
                gameDuration: info.gameDuration || null,
                gameMode: queueType,
                participants,
                me,
                itemBuild,
                teamMatesSummary: team,
              };
            } catch (err) {
              meta.errors.push({ endpoint: 'match_detail', status: 'network', message: String(err) });
              return null;
            }
          };

          const detailed = await pMapLimit(matchIds, 2, matchFetch);
          matches = (detailed.filter(Boolean) as any[]).slice(0, 10);
        } else {
          meta.errors.push({ endpoint: matchIdsUrl, status: mRes.status, body: mRes.body });
        }
      } catch (err) {
        meta.errors.push({ endpoint: 'matchIds', status: 'network', message: String(err) });
      }
    }

    // 5) Champions aggregation from matches
    const championsPlayedAgg: Record<string, any> = {};
    // Aggregate champion-level stats (include cs/damage per minute)
    for (const m of matches) {
      const champ = m.me?.champion?.name || m.me?.championName || 'Unknown';
      if (!championsPlayedAgg[champ]) championsPlayedAgg[champ] = { championName: champ, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, cs: 0, durationSeconds: 0 };
      const agg = championsPlayedAgg[champ];
      agg.games += 1;
      if (m.me?.win) agg.wins += 1;
      agg.kills += (m.me?.kills || 0);
      agg.deaths += (m.me?.deaths || 0);
      agg.assists += (m.me?.assists || 0);
      agg.damage += (m.me?.totalDamageDealtToChampions || 0);
      agg.cs += (m.me?.cs || m.me?.totalMinionsKilled || 0) + (m.me?.neutralMinionsKilled || 0);
      agg.durationSeconds += (m.gameDuration || 0);
    }

    const championsPlayed = Object.values(championsPlayedAgg).map((c: any) => ({
      id: 0,
      name: c.championName,
      imageUrl: c.championName ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${c.championName.replace(/[^A-Za-z0-9]/g,'')}.png` : '',
      games: c.games,
      wins: c.wins,
      losses: c.games - c.wins,
      kda: c.games ? Number(((c.kills + c.assists) / Math.max(1, c.deaths)).toFixed(2)) : 0,
      kills: c.kills,
      deaths: c.deaths,
      assists: c.assists,
      dmgPerMinute: c.durationSeconds > 0 ? Math.round((c.damage / (c.durationSeconds / 60)) || 0) : 0,
      dmgTakenPerMinute: 0,
      csPerMinute: c.durationSeconds > 0 ? Number((c.cs / (c.durationSeconds / 60)).toFixed(2)) : 0,
      gd15: 0,
      csd15: 0,
      dmgPercentage: 0
    }));

    // Teammates - aggregate
    const teammatesResult: any[] = [];
    const teammateMap: Record<string, any> = {};
    for (const m of matches) {
      const team = m.teamMatesSummary || [];
      for (const tm of team) {
        const key = tm.summonerName || '';
        if (!teammateMap[key]) teammateMap[key] = { name: tm.summonerName || '', tag: '', profileIconId: 0, games: 0, wins: 0, losses: 0 };
        teammateMap[key].games += 1;
        if (tm.win) teammateMap[key].wins +=1; else teammateMap[key].losses +=1;
      }
    }
    for (const k of Object.keys(teammateMap)) {
      const t = teammateMap[k];
      t.winrate = t.games ? Math.round((t.wins / t.games) * 100) : 0;
      teammatesResult.push(t);
    }

    // Determine partialData
    const missingId = !summoner?.id;
    const hasLeagueError = meta.errors.some((e: any) => String(e.endpoint || '').includes('/lol/league'));
    const partialData = Boolean(account && (missingId || hasLeagueError || meta.errors.length > 0));

    // Build profile
    const profile = {
      name: account.gameName || name,
      tag: account.tagLine || tag || region,
      level: summoner?.summonerLevel || 0,
      profileIconId: summoner?.profileIconId || account?.profileIconId || 0,
      ranks: {
        solo: soloEntry ? { tier: soloEntry.tier, rank: soloEntry.rank, lp: soloEntry.leaguePoints || 0, wins: soloEntry.wins || 0, losses: soloEntry.losses || 0 } : { tier: null, rank: null, lp: null, wins: null, losses: null },
        flex: flexEntry ? { tier: flexEntry.tier, rank: flexEntry.rank, lp: flexEntry.leaguePoints || 0, wins: flexEntry.wins || 0, losses: flexEntry.losses || 0 } : { tier: null, rank: null, lp: null, wins: null, losses: null }
      },
      pastRanks: [],
      ladderRank: rank.ladder.position || 0,
      topPercent: rank.ladder.topPercent || 0,
      lastUpdated: Date.now()
    };

    const payload = {
      profile,
      matches,
      heatmap: [],
      champions: championsPlayed,
      teammates: teammatesResult,
      partialData,
      meta: { endpointsCalled: meta.endpointsCalled, notes: meta.errors.length ? 'Some endpoints failed - see meta.errors' : 'All requested endpoints attempted', errors: meta.errors, debugSnapshots: meta.debugSnapshots }
    };

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
