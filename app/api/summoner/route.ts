import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_PATCH } from '../../../constants';
import type { RiotAccount, RiotSummoner, RiotMatch } from '../../../types';
import { fetchRiotAccount, fetchSummonerByPuuid, fetchMatchIds, riotFetchRaw, mapWithConcurrency, PLATFORM_MAP, REGION_ROUTING } from '../../../services/riotService';

function isValidRegion(region: string): region is keyof typeof PLATFORM_MAP {
  return Object.prototype.hasOwnProperty.call(PLATFORM_MAP, region);
}

function isValidNamePart(value: string): boolean {
  // Riot autorise lettres, chiffres, espaces et quelques caractères spéciaux. Ici on fait un contrôle simple.
  if (!value) return false;
  if (value.length > 16) return false;
  // On tolère lettres, chiffres, espaces, _ . -
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
      // Si Riot renvoie 403 (Forbidden), on renvoie une erreur explicite côté API
      if (message.includes('RIOT_403')) {
        meta.errors.push({ endpoint: 'riot/account/v1/accounts/by-riot-id', status: 403, message });
        return NextResponse.json(
          {
            error: 'RIOT_FORBIDDEN',
            reason: 'Riot API returned 403 Forbidden for this request. Vérifie que ta clé est active et que tu utilises bien une clé dev ou personnelle correcte.',
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

    // If id missing, try fallback by-name (may return 403)
    if (!summoner?.id) {
      try {
        const byNameUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(account.gameName || name)}`;
        const fallbackRes = await riotFetchRaw(byNameUrl);
        meta.endpointsCalled.push({ endpoint: byNameUrl, status: fallbackRes.status, fallback: true });
        if (fallbackRes.ok) {
          const fallbackParsed = JSON.parse(fallbackRes.body || '{}') as RiotSummoner;
          if (fallbackParsed.id) {
            summoner = { ...(summoner || {} as any), ...fallbackParsed };
            meta.debugSnapshots.push({ step: 'fallback_by_name_success', assignedId: summoner.id });
          }
        } else {
          // on ne bloque plus la requête si le fallback échoue (403, 404...), on log seulement dans meta
          meta.errors.push({ endpoint: byNameUrl, status: fallbackRes.status, body: fallbackRes.body });
        }
      } catch (fbErr) {
        // idem, on log sans bloquer
        meta.errors.push({ endpoint: 'fallback_by_name', status: 'network', message: String(fbErr) });
      }
    }

    // 3) Leagues (only if we have summoner.id)
    let leagueEntries: any[] = [];
    if (summoner && summoner.id) {
      try {
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
      ladder: { position: null, topPercent: null },
    };

    // 4) Match IDs (match history up to 10)
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
          const ddRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/data/en_US/item.json`);
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
              const imageUrl = key ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${key}.png` : '';

              const totalMinions = Number(p.totalMinionsKilled ?? p.totalMinions ?? 0);
              const neutral = Number(p.neutralMinionsKilled ?? 0);
              const cs = (Number.isFinite(totalMinions) ? totalMinions : 0) + (Number.isFinite(neutral) ? neutral : 0);

              const level = typeof p.champLevel === 'number' ? p.champLevel : typeof p.level === 'number' ? p.level : 0;

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
                  imageUrl: id ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/item/${id}.png` : '',
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
            if (me) {
              me.summonerName = me.summonerName || account!.gameName || name;
              me.tagLine = me.tagLine || account!.tagLine || tag || region;
            }
            if (!me) return null;

            const itemBuild: any[] = [];
            try {
              const frames = (info as any).frames || [];
              const events: any[] = frames.flatMap((f: any) => f.events || []);
              const myEvents = events.filter(
                (e) => ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type) && e.participantId === me.participantId,
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
                const kda = (Number(p.kills || 0) + Number(p.assists || 0)) / Math.max(1, Number(p.deaths || 0));
                const kdaNorm = Math.min(kda / 5, 1);
                const visionNorm = Math.min(Number(p.visionScore || 0) / 60, 1);
                const goldNorm = Number(p.goldEarned || 0) / maxGold;
                const raw = dmgNorm * 0.6 + kdaNorm * 0.2 + visionNorm * 0.1 + goldNorm * 0.1;
                (p as any).opScore = Math.round(Math.max(0, Math.min(100, raw * 100)));
              }
            } catch {
              // non critique
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
        });

        matches = (detailed.filter(Boolean) as any[]).slice(0, 10);
      } catch (err) {
        meta.errors.push({ endpoint: 'matchIds', status: 'network', message: String(err) });
      }
    }

    // 5) Champions aggregation from matches
    const championsPlayedAgg: Record<string, any> = {};
    for (const m of matches) {
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
          cs: 0,
          durationSeconds: 0,
        };
      }
      const agg = championsPlayedAgg[champ];
      agg.games += 1;
      if (m.me?.win) agg.wins += 1;
      agg.kills += m.me?.kills || 0;
      agg.deaths += m.me?.deaths || 0;
      agg.assists += m.me?.assists || 0;
      agg.damage += m.me?.totalDamageDealtToChampions || 0;
      agg.cs += (m.me?.cs || m.me?.totalMinionsKilled || 0) + (m.me?.neutralMinionsKilled || 0);
      agg.durationSeconds += m.gameDuration || 0;
    }

    const championsPlayed = Object.values(championsPlayedAgg).map((c: any) => ({
      id: 0,
      name: c.championName,
      imageUrl: c.championName
        ? `https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/champion/${c.championName.replace(
            /[^A-Za-z0-9]/g,
            '',
          )}.png`
        : '',
      games: c.games,
      wins: c.wins,
      losses: c.games - c.wins,
      kda: c.games ? Number(((c.kills + c.assists) / Math.max(1, c.deaths)).toFixed(2)) : 0,
      kills: c.kills,
      deaths: c.deaths,
      assists: c.assists,
      dmgPerMinute:
        c.durationSeconds > 0 ? Math.round((c.damage / (c.durationSeconds / 60)) || 0) : 0,
      dmgTakenPerMinute: 0,
      csPerMinute:
        c.durationSeconds > 0
          ? Number((c.cs / (c.durationSeconds / 60)).toFixed(2))
          : 0,
      gd15: 0,
      csd15: 0,
      dmgPercentage: 0,
    }));

    const teammatesResult: any[] = [];
    const teammateMap: Record<string, any> = {};
    for (const m of matches) {
      const team = m.teamMatesSummary || [];
      for (const tm of team) {
        const key = tm.summonerName || '';
        if (!teammateMap[key]) {
          teammateMap[key] = {
            name: tm.summonerName || '',
            tag: '',
            profileIconId: 0,
            games: 0,
            wins: 0,
            losses: 0,
          };
        }
        teammateMap[key].games += 1;
        if (tm.win) teammateMap[key].wins += 1;
        else teammateMap[key].losses += 1;
      }
    }
    for (const k of Object.keys(teammateMap)) {
      const t = teammateMap[k];
      t.winrate = t.games ? Math.round((t.wins / t.games) * 100) : 0;
      teammatesResult.push(t);
    }

    const missingId = !summoner?.id;
    const hasLeagueError = meta.errors.some((e: any) => String(e.endpoint || '').includes('/lol/league'));
    const partialData = Boolean(account && (missingId || hasLeagueError || meta.errors.length > 0));

    const profile = {
      name: account.gameName || name,
      tag: account.tagLine || tag || region,
      level: summoner?.summonerLevel || 0,
      profileIconId: summoner?.profileIconId || 0,
      ranks: {
        solo: soloEntry
          ? {
              tier: soloEntry.tier,
              rank: soloEntry.rank,
              lp: soloEntry.leaguePoints || 0,
              wins: soloEntry.wins || 0,
              losses: soloEntry.losses || 0,
            }
          : { tier: null, rank: null, lp: null, wins: null, losses: null },
        flex: flexEntry
          ? {
              tier: flexEntry.tier,
              rank: flexEntry.rank,
              lp: flexEntry.leaguePoints || 0,
              wins: flexEntry.wins || 0,
              losses: flexEntry.losses || 0,
            }
          : { tier: null, rank: null, lp: null, wins: null, losses: null },
      },
      pastRanks: [],
      ladderRank: rank.ladder.position || 0,
      topPercent: rank.ladder.topPercent || 0,
      lastUpdated: Date.now(),
    };

    const payload = {
      profile,
      matches,
      heatmap: [],
      champions: championsPlayed,
      teammates: teammatesResult,
      partialData,
      meta: {
        endpointsCalled: meta.endpointsCalled,
        notes: meta.errors.length
          ? 'Some endpoints failed - see meta.errors'
          : 'All requested endpoints attempted',
        errors: meta.errors,
        debugSnapshots: meta.debugSnapshots,
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
