import { NextRequest, NextResponse } from 'next/server';
import { MatchProcessor } from '../../../services/MatchProcessor';
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
  fetchLeagueEntriesByPuuid,
} from '../../../services/RiotService';
import { prisma } from '../../../lib/prisma';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl, getRuneIconUrl } from '../../../utils/ddragon';

// Helper to check if cache is valid (e.g., 10 minutes)
const CACHE_TTL = 10 * 60 * 1000;
const isCacheValid = (lastFetch: Date | null) => {
  if (!lastFetch) return false;
  return (Date.now() - new Date(lastFetch).getTime()) < CACHE_TTL;
};

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

    if (!rawName) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!isValidRegion(rawRegion)) return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    if (!isValidNamePart(rawName) || (rawTag && !isValidNamePart(rawTag))) {
      return NextResponse.json({ error: 'Invalid summoner name or tag' }, { status: 400 });
    }

    const name = rawName.trim();
    const tag = (rawTag || rawRegion).trim();
    const region = rawRegion;
    const platform = PLATFORM_MAP[region];
    const routing = REGION_ROUTING[region];

    // 1. Check DB for Summoner
    let dbSummoner = await prisma.summoner.findUnique({
      where: {
        gameName_tagLine: {
          gameName: name,
          tagLine: tag,
        },
      },
      include: {
        ranks: true,
      },
    });

    let puuid = dbSummoner?.puuid;
    let account: RiotAccount | null = null;
    let summoner: RiotSummoner | null = null;

    const forceUpdate = url.searchParams.get('force') === 'true';

    // 2. Ingest/Update Summoner if missing, stale, or forced
    const shouldUpdate = !dbSummoner || !isCacheValid(dbSummoner.lastMatchFetch) || forceUpdate;

    if (shouldUpdate) {
      try {
        // Fetch Account
        if (!puuid) {
          account = await fetchRiotAccount(name, tag, routing);
          puuid = account.puuid;
          meta.endpointsCalled.push({ endpoint: 'riot/account/v1/accounts/by-riot-id', status: 200 });
        }

        // Fetch Summoner details
        summoner = await fetchSummonerByPuuid(puuid!, platform);
        meta.endpointsCalled.push({ endpoint: 'lol/summoner/v4/summoners/by-puuid', status: 200 });

        // Upsert Summoner
        dbSummoner = await prisma.summoner.upsert({
          where: { puuid: puuid! },
          update: {
            gameName: account?.gameName || name,
            tagLine: account?.tagLine || tag,
            profileIconId: summoner.profileIconId,
            summonerLevel: summoner.summonerLevel,
            accountId: summoner.accountId,
            summonerId: summoner.id,
            updatedAt: new Date(),
          },
          create: {
            puuid: puuid!,
            gameName: account?.gameName || name,
            tagLine: account?.tagLine || tag,
            profileIconId: summoner.profileIconId,
            summonerLevel: summoner.summonerLevel,
            accountId: summoner.accountId,
            summonerId: summoner.id,
            lastMatchFetch: null,
          },
          include: { ranks: true },
        });

        // Fetch Ranks (using PUUID now!)
        const lRes = await fetchLeagueEntriesByPuuid(puuid!, platform);
        meta.endpointsCalled.push({ endpoint: `lol/league/v4/entries/by-puuid/${puuid}`, status: lRes.status });

        if (lRes.ok) {
          const leagueEntries = JSON.parse(lRes.body || '[]');

          // Update Ranks in DB AND Save Snapshot
          for (const entry of leagueEntries) {
            if (entry.queueType === 'RANKED_SOLO_5x5' || entry.queueType === 'RANKED_FLEX_SR') {
              // 1. Upsert Current Rank
              await prisma.summonerRank.upsert({
                where: {
                  summonerPuuid_queueType: {
                    summonerPuuid: puuid!,
                    queueType: entry.queueType,
                  },
                },
                update: {
                  tier: entry.tier,
                  rank: entry.rank,
                  leaguePoints: entry.leaguePoints,
                  wins: entry.wins,
                  losses: entry.losses,
                  updatedAt: new Date(),
                },
                create: {
                  summonerPuuid: puuid!,
                  queueType: entry.queueType,
                  tier: entry.tier,
                  rank: entry.rank,
                  leaguePoints: entry.leaguePoints,
                  wins: entry.wins,
                  losses: entry.losses,
                },
              });

              // 2. Create Snapshot (for history) ONLY if changed
              try {
                const lastSnapshot = await prisma.leagueSnapshot.findFirst({
                  where: { summonerPuuid: puuid!, queueType: entry.queueType },
                  orderBy: { timestamp: 'desc' }
                });

                if (!lastSnapshot ||
                  lastSnapshot.tier !== entry.tier ||
                  lastSnapshot.rank !== entry.rank ||
                  lastSnapshot.leaguePoints !== entry.leaguePoints) {

                  await prisma.leagueSnapshot.create({
                    data: {
                      summonerPuuid: puuid!,
                      queueType: entry.queueType,
                      tier: entry.tier,
                      rank: entry.rank,
                      leaguePoints: entry.leaguePoints,
                      wins: entry.wins,
                      losses: entry.losses,
                      timestamp: new Date(),
                    }
                  });
                }
              } catch (snapErr) {
                console.error('Failed to create snapshot:', snapErr);
                // Continue execution, don't block the response
              }
            }
          }
        }

      } catch (err: any) {
        console.error('Error updating summoner:', err);
        if (!dbSummoner) {
          return NextResponse.json({ error: 'Summoner not found or Riot API error', details: String(err) }, { status: 404 });
        }
      }
    }

    // 3. Ingest/Update Matches
    if (shouldUpdate && puuid) {
      try {
        const matchIds = await fetchMatchIds(puuid, routing, 0, 60);
        meta.endpointsCalled.push({ endpoint: 'lol/match/v5/matches/by-puuid', status: 200, count: matchIds.length });

        const existingMatches = await prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: { id: true },
        });
        const existingIds = new Set(existingMatches.map(m => m.id));
        const newMatchIds = matchIds.filter(id => !existingIds.has(id)).slice(0, 20);

        const processMatch = async (matchId: string) => {
          try {
            const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            const r = await riotFetchRaw(matchUrl);
            if (!r.ok) return null;
            const matchData = JSON.parse(r.body || '{}');

            let timelineData = null;
            if (matchIds.indexOf(matchId) < 20) {
              const timelineUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
              const tRes = await riotFetchRaw(timelineUrl);
              if (tRes.ok) {
                timelineData = JSON.parse(tRes.body || '{}');
              }
            }

            if (timelineData) {
              matchData.timeline = timelineData;
            }

            return { id: matchId, data: matchData };
          } catch (e) {
            return null;
          }
        };

        const newMatchesData = await mapWithConcurrency(newMatchIds, 3, processMatch);

        for (const m of newMatchesData) {
          if (!m) continue;
          const info = m.data.info;

          await prisma.match.create({
            data: {
              id: m.id,
              gameCreation: new Date(info.gameStartTimestamp),
              gameDuration: info.gameDuration,
              gameMode: info.gameMode,
              gameVersion: info.gameVersion,
              jsonData: m.data,
            },
          });

          for (const p of info.participants) {
            if (p.puuid === puuid) {
              await prisma.summonerMatch.create({
                data: {
                  summonerPuuid: puuid,
                  matchId: m.id,
                  championId: p.championId,
                  win: p.win,
                  kills: p.kills,
                  deaths: p.deaths,
                  assists: p.assists,
                  role: p.teamPosition || 'UNKNOWN',
                }
              });
            }
          }

          // OPTIMIZATION: Process for Tier List immediately using existing JSON
          // This prevents re-fetching from Riot API later
          try {
            // Determine Tier from DB (use highest of Solo/Flex)
            const ranks = dbSummoner?.ranks || [];
            const solo = ranks.find(r => r.queueType === 'RANKED_SOLO_5x5');
            const flex = ranks.find(r => r.queueType === 'RANKED_FLEX_SR');
            const tier = solo?.tier || flex?.tier || 'EMERALD'; // Fallback to EMERALD if unranked

            // m is { id: string, data: any }
            await MatchProcessor.processMatch(m.id, region, tier, m.data);
          } catch (err) {
            console.error(`Background processing failed for ${m.id}`, err);
          }
        }


        await prisma.summoner.update({
          where: { puuid: puuid! },
          data: {
            lastMatchFetch: new Date(),
            updatedAt: new Date() // Ensure lastUpdated reflects this fetch
          },
        });

      } catch (err) {
        console.error('Error updating matches:', err);
      }
    }

    // 4. Return Data from DB
    const finalSummoner = await prisma.summoner.findUnique({
      where: { puuid: puuid! },
      include: { ranks: true, snapshots: { orderBy: { timestamp: 'asc' } } }, // Fetch snapshots
    });

    if (!finalSummoner) throw new Error('Summoner not found after update');

    const summonerMatches = await prisma.summonerMatch.findMany({
      where: { summonerPuuid: puuid! },
      include: { match: true },
      orderBy: { match: { gameCreation: 'desc' } },
      take: 60,
    });

    const latestVersion = CURRENT_PATCH;

    const matches = await Promise.all(summonerMatches.map(async (sm) => {
      const mj = sm.match.jsonData as any;
      // Pass averageRank from DB to processing function
      return processMatchData(mj, puuid!, latestVersion, (sm.match as any).averageRank);
    }));

    // 5. Aggregations with Robust LP History
    const { champions, heatmap, teammates, lpHistory, performance } = calculateAggregations(matches, finalSummoner, latestVersion);

    const profile: SummonerProfile = {
      name: finalSummoner.gameName,
      tag: finalSummoner.tagLine,
      level: finalSummoner.summonerLevel,
      profileIconId: finalSummoner.profileIconId,
      ranks: {
        solo: {
          tier: finalSummoner.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5')?.tier || 'UNRANKED',
          rank: finalSummoner.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5')?.rank || '',
          lp: finalSummoner.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5')?.leaguePoints || 0,
          wins: finalSummoner.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5')?.wins || 0,
          losses: finalSummoner.ranks.find(r => r.queueType === 'RANKED_SOLO_5x5')?.losses || 0,
        },
        flex: {
          tier: finalSummoner.ranks.find(r => r.queueType === 'RANKED_FLEX_SR')?.tier || 'UNRANKED',
          rank: finalSummoner.ranks.find(r => r.queueType === 'RANKED_FLEX_SR')?.rank || '',
          lp: finalSummoner.ranks.find(r => r.queueType === 'RANKED_FLEX_SR')?.leaguePoints || 0,
          wins: finalSummoner.ranks.find(r => r.queueType === 'RANKED_FLEX_SR')?.wins || 0,
          losses: finalSummoner.ranks.find(r => r.queueType === 'RANKED_FLEX_SR')?.losses || 0,
        },
      },
      pastRanks: [],
      ladderRank: 0,
      topPercent: 0,
      lastUpdated: finalSummoner.updatedAt.getTime(),
    };

    return NextResponse.json({
      profile,
      matches,
      champions,
      heatmap,
      teammates,
      lpHistory,
      performance,
      meta,
      version: latestVersion
    });

  } catch (e) {
    console.error('[summoner] fatal error', e);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// --- Helper Functions ---

let runesCache: any = null;
async function getRunesData(version: string) {
  if (runesCache) return runesCache;
  try {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`, { next: { revalidate: 86400 } });
    if (res.ok) {
      runesCache = await res.json();
      return runesCache;
    }
  } catch (e) {
    console.error('Failed to fetch runes:', e);
  }
  return [];
}

function getRuneImages(perks: any, runesData: any[]) {
  if (!perks || !runesData) return { primary: null, secondary: null };

  const styles = perks.styles || [];
  const primaryStyle = styles.find((s: any) => s.description === 'primaryStyle');
  const subStyle = styles.find((s: any) => s.description === 'subStyle');

  let primaryImg = '';
  let secondaryImg = '';

  // Find Keystone (Primary Style -> First Selection)
  if (primaryStyle && primaryStyle.selections && primaryStyle.selections.length > 0) {
    const keystoneId = primaryStyle.selections[0].perk;
    // Find the style in runesData
    const styleData = runesData.find((r: any) => r.id === primaryStyle.style);
    if (styleData && styleData.slots && styleData.slots[0]) {
      const keystoneData = styleData.slots[0].runes.find((r: any) => r.id === keystoneId);
      if (keystoneData) {
        primaryImg = getRuneIconUrl(keystoneData.icon);
      }
    }
  }

  // Find Secondary Style Icon
  if (subStyle) {
    const styleData = runesData.find((r: any) => r.id === subStyle.style);
    if (styleData) {
      secondaryImg = getRuneIconUrl(styleData.icon);
    }
  }

  return { primary: primaryImg, secondary: secondaryImg };
}

async function processMatchData(mj: any, puuid: string, version: string, averageRank?: string | null) {
  const info = mj.info;
  const participants = info.participants;
  const me = participants.find((p: any) => p.puuid === puuid);

  const timelineJson = mj.timeline;
  const runesData = await getRunesData(version);

  // Calculate Team Total Damage for percentages
  const teamDamage: Record<number, number> = { 100: 0, 200: 0 };
  let maxDamage = 0;
  participants.forEach((p: any) => {
    const dmg = (p.totalDamageDealtToChampions || 0);
    teamDamage[p.teamId] += dmg;
    if (dmg > maxDamage) maxDamage = dmg;
  });

  const myTeamDamage = teamDamage[me.teamId] || 1;
  const cs = (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0);

  const stats: any = {
    gpm: (me.goldEarned || 0) / ((info.gameDuration || 1) / 60),
    csm: cs / ((info.gameDuration || 1) / 60),
    dpm: (me.totalDamageDealtToChampions || 0) / ((info.gameDuration || 1) / 60),
    dmgPercentage: ((me.totalDamageDealtToChampions || 0) / myTeamDamage) * 100,
    kda: (me.kills + me.assists) / Math.max(1, me.deaths),
    gd15: 0, csd15: 0, xpd15: 0
  };

  // Timeline processing
  let timelineData = null;
  const itemBuild: any[] = [];
  let ace = false;

  if (timelineJson) {
    const frames = timelineJson.info?.frames || [];

    // Check for ACE event
    const events = frames.flatMap((f: any) => f.events || []);
    const myAce = events.find((e: any) => e.type === 'CHAMPION_KILL' && e.ace === true && e.killerId === me.participantId);
    if (myAce) ace = true;

    // @15 Stats
    const frame15 = frames.find((f: any) => f.timestamp >= 900000 && f.timestamp < 960000) || frames[frames.length - 1];
    if (frame15) {
      const myFrame = frame15.participantFrames?.[me.participantId];
      const opponent = participants.find((p: any) => p.teamPosition === me.teamPosition && p.teamId !== me.teamId);
      if (myFrame && opponent) {
        const oppFrame = frame15.participantFrames?.[opponent.participantId];
        if (oppFrame) {
          stats.gd15 = (myFrame.totalGold || 0) - (oppFrame.totalGold || 0);
          stats.xpd15 = (myFrame.xp || 0) - (oppFrame.xp || 0);
          stats.csd15 = ((myFrame.minionsKilled || 0) + (myFrame.jungleMinionsKilled || 0)) - ((oppFrame.minionsKilled || 0) + (oppFrame.jungleMinionsKilled || 0));
        }
      }
    }

    // Graph Points
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

    // Item Build
    const myEvents = events.filter(
      (e: any) =>
        ['ITEM_PURCHASED', 'ITEM_SOLD', 'ITEM_UNDO'].includes(e.type) &&
        e.participantId === me.participantId,
    );
    myEvents.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

    const cleanEvents: any[] = [];
    for (const ev of myEvents) {
      if (ev.type === 'ITEM_PURCHASED' || ev.type === 'ITEM_SOLD') {
        cleanEvents.push(ev);
      } else if (ev.type === 'ITEM_UNDO') {
        const lastIdx = cleanEvents.length - 1;
        if (lastIdx >= 0) {
          const lastEv = cleanEvents[lastIdx];
          if (lastEv.type === 'ITEM_PURCHASED' && lastEv.itemId === ev.beforeId) {
            cleanEvents.pop();
          } else if (lastEv.type === 'ITEM_SOLD' && lastEv.itemId === ev.afterId) {
            cleanEvents.pop();
          }
        }
      }
    }

    for (const ev of cleanEvents) {
      const itemId = ev.itemId || ev.itemIdPurchased || ev.itemIdSold || ev.itemIdAdded || null;
      if (!itemId) continue;
      const ts = Math.floor((ev.timestamp || 0) / 1000);
      const mm = Math.floor(ts / 60);
      const ss = ts % 60;
      const timestamp = `${mm}m ${ss}s`;
      const action = ev.type || 'ITEM_PURCHASED';

      itemBuild.push({
        timestamp,
        action,
        item: {
          id: itemId,
          imageUrl: getItemIconUrl(itemId, version),
          name: `Item ${itemId}`,
          tags: [],
        },
      });
    }
  }

  // OP Score Calculation Helper
  const calculateScore = (p: any) => {
    let score = 0;

    // KDA (Max 4 pts)
    const kda = (p.kills + p.assists) / Math.max(1, p.deaths);
    score += Math.min(4, kda / 3);

    // Damage Share (Max 2 pts)
    const teamId = p.teamId;
    const teamTotal = teamDamage[teamId] || 1;
    const dmgShare = (p.totalDamageDealtToChampions || 0) / teamTotal;
    score += Math.min(2, dmgShare * 5); // 20% dmg = 1pt, 40% = 2pts

    // Vision (Max 1 pt)
    const vision = p.visionScore || 0;
    const durationMin = (info.gameDuration || 1) / 60;
    score += Math.min(1, vision / durationMin); // 1 vision/min = 1pt

    // CS (Max 1 pt)
    const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
    const csm = cs / durationMin;
    score += Math.min(1, csm / 8); // 8 cs/min = 1pt

    // Objectives/KP (Max 1 pt)
    const kp = ((p.kills + p.assists) / Math.max(1, (teamId === 100 ? participants.filter((x: any) => x.teamId === 100).reduce((a: number, b: any) => a + b.kills, 0) : participants.filter((x: any) => x.teamId === 200).reduce((a: number, b: any) => a + b.kills, 0))));
    score += Math.min(1, kp);

    // Win Bonus (1 pt)
    if (p.win) score += 1;

    return Math.min(10, score);
  };

  // Calculate Team Kills for KP
  const t100Kills = participants.filter((p: any) => p.teamId === 100).reduce((a: number, b: any) => a + b.kills, 0);
  const t200Kills = participants.filter((p: any) => p.teamId === 200).reduce((a: number, b: any) => a + b.kills, 0);

  // Map Participants
  const mappedParticipants = participants.map((p: any) => {
    const pCs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
    const runes = getRuneImages(p.perks, runesData);
    const opScore = calculateScore(p);

    return {
      ...p,
      cs: pCs,
      runes,
      level: p.champLevel || 0, // Ensure level is present
      opScore, // Add calculated score
      champion: {
        id: p.championId,
        name: p.championName,
        imageUrl: getChampionIconUrl(p.championName, version)
      },
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map(id => ({
        id,
        imageUrl: id ? getItemIconUrl(id, version) : '',
        name: `Item ${id}`
      })),
      spells: [p.summoner1Id, p.summoner2Id].map(id => ({
        id,
        imageUrl: getSpellIconUrl(getSpellName(id), version)
      })),
      // Use Riot ID fields for V5
      summonerName: p.riotIdGameName || p.summonerName || 'Unknown',
      tagLine: p.riotIdTagline || p.riotIdTagLine || '',
      totalMinionsKilled: p.totalMinionsKilled,
      neutralMinionsKilled: p.neutralMinionsKilled,
      teamPosition: p.teamPosition,
      pentaKills: p.pentaKills,
      quadraKills: p.quadraKills,
      wardsPlaced: p.wardsPlaced,
      wardsKilled: p.wardsKilled,
      visionWardsBoughtInGame: p.visionWardsBoughtInGame,
      killParticipation: (p.teamId === 100 ? t100Kills : t200Kills) > 0 ? ((p.kills + p.assists) / (p.teamId === 100 ? t100Kills : t200Kills)) : 0,
    };
  });

  // Rank participants by OP Score to assign 1st-10th
  const sortedByScore = [...mappedParticipants].sort((a: any, b: any) => b.opScore - a.opScore);
  mappedParticipants.forEach((p: any) => {
    const rank = sortedByScore.findIndex((x: any) => x.puuid === p.puuid) + 1;
    p.opScoreRank = rank; // We need to add this to types if we want to use it typed, but for now passing it as prop
  });

  const mappedMe = mappedParticipants.find((p: any) => p.puuid === puuid) || mappedParticipants[0];

  const team = mappedParticipants
    .filter((p: any) => p.teamId === mappedMe.teamId && p.puuid !== puuid)
    .map((p: any) => ({
      summonerName: p.summonerName,
      tagLine: p.tagLine,
      profileIconId: p.profileIcon || p.profileIconId || 0,
      puuid: p.puuid,
      champion: p.champion?.name || '',
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win,
    }));

  const teams = (info.teams || []).map((t: any) => {
    const timelineEvents = mj.timeline?.info?.frames?.flatMap((f: any) => f.events || []) || [];
    const hordeKills100 = timelineEvents.filter((e: any) => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'HORDE' && (e.killerTeamId === 100 || (e.killerId && participants.find((p: any) => p.participantId === e.killerId)?.teamId === 100))).length;
    const hordeKills200 = timelineEvents.filter((e: any) => e.type === 'ELITE_MONSTER_KILL' && e.monsterType === 'HORDE' && (e.killerTeamId === 200 || (e.killerId && participants.find((p: any) => p.participantId === e.killerId)?.teamId === 200))).length;

    const objectives = {
      baron: t.objectives?.baron || { kills: 0, first: false },
      champion: t.objectives?.champion || { kills: 0, first: false },
      dragon: t.objectives?.dragon || { kills: 0, first: false },
      inhibitor: t.objectives?.inhibitor || { kills: 0, first: false },
      riftHerald: t.objectives?.riftHerald || { kills: 0, first: false },
      tower: t.objectives?.tower || { kills: 0, first: false },
      voidGrub: { kills: t.teamId === 100 ? hordeKills100 : hordeKills200, first: false },
    };

    return {
      teamId: t.teamId,
      win: t.win,
      objectives
    };
  });

  return {
    id: mj.metadata.matchId,
    gameCreation: info.gameStartTimestamp,
    gameDuration: info.gameDuration,
    gameMode: info.gameMode,
    queueId: info.queueId,
    gameVersion: info.gameVersion,
    averageRank: averageRank || undefined,
    participants: mappedParticipants,
    me: { ...mappedMe, summonerName: mappedMe.summonerName || 'Me', ace },
    stats,
    timelineData,
    itemBuild,
    teamMatesSummary: team,
    championPickBan: [],
    teams,
  };
}

function calculateAggregations(matches: any[], summoner: any, version: string) {
  const championsPlayedAgg: Record<string, any> = {};
  const heatmapAgg: Record<string, { games: number; wins: number; losses: number }> = {};
  const teammatesMap: Record<string, any> = {};

  // --- Robust LP History Calculation ---
  // Method: Snapshot-based with Inference Fallback
  // 1. Get all snapshots for Solo Queue
  const snapshots = (summoner.snapshots || []).filter((s: any) => s.queueType === 'RANKED_SOLO_5x5');
  // Sort snapshots by timestamp ASC
  snapshots.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 2. Get all Solo Queue matches, sorted ASC
  const soloMatches = matches.filter((m: any) => m.gameMode === 'RANKED_SOLO_5x5')
    .sort((a: any, b: any) => (a.gameCreation || 0) - (b.gameCreation || 0));

  const lpPointsTmp: { date: string; fullDate: string; lp: number; tier: string; rank: string; method: 'exact' | 'estimated'; ts: number }[] = [];

  // Helper to add point
  const addPoint = (ts: number, lp: number, tier: string, rank: string, method: 'exact' | 'estimated') => {
    const d = new Date(ts);
    lpPointsTmp.push({
      date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      fullDate: d.toLocaleDateString('fr-FR'),
      lp,
      tier,
      rank,
      method,
      ts
    });
  };

  if (snapshots.length > 0) {
    // We have snapshots. Use them as anchors.

    // Part A: Matches BEFORE first snapshot (Reverse Inference)
    const firstSnap = snapshots[0];
    const matchesBefore = soloMatches.filter((m: any) => m.gameCreation < new Date(firstSnap.timestamp).getTime());

    // Walk backwards from first snapshot
    let currentLp = firstSnap.leaguePoints;
    // Reverse matches to walk back
    const matchesBeforeDesc = [...matchesBefore].reverse();

    for (const m of matchesBeforeDesc) {
      const change = m.me.win ? 20 : -20;
      currentLp -= change; // Reverse: if we won, we had less before
      addPoint(m.gameCreation, currentLp, firstSnap.tier, firstSnap.rank, 'estimated');
    }

    // Part B: Matches BETWEEN snapshots
    for (let i = 0; i < snapshots.length; i++) {
      const snap = snapshots[i];
      // Add the snapshot point itself (Exact)
      addPoint(new Date(snap.timestamp).getTime(), snap.leaguePoints, snap.tier, snap.rank, 'exact');

      if (i < snapshots.length - 1) {
        const nextSnap = snapshots[i + 1];
        const matchesBetween = soloMatches.filter((m: any) =>
          m.gameCreation > new Date(snap.timestamp).getTime() &&
          m.gameCreation < new Date(nextSnap.timestamp).getTime()
        );

        if (matchesBetween.length > 0) {
          const deltaLp = nextSnap.leaguePoints - snap.leaguePoints;

          let simulatedLp = snap.leaguePoints;
          const standardChange = (m: any) => m.me.win ? 20 : -20;

          // Calculate "Expected" end LP with standard model
          let expectedEndLp = simulatedLp;
          matchesBetween.forEach((m: any) => expectedEndLp += standardChange(m));

          const error = nextSnap.leaguePoints - expectedEndLp;
          const correctionPerMatch = error / matchesBetween.length;

          for (const m of matchesBetween) {
            simulatedLp += (standardChange(m) + correctionPerMatch);
            addPoint(m.gameCreation, Math.round(simulatedLp), snap.tier, snap.rank, 'estimated');
          }
        }
      }
    }

    // Part C: Matches AFTER last snapshot (Forward Inference)
    const lastSnap = snapshots[snapshots.length - 1];
    const matchesAfter = soloMatches.filter((m: any) => m.gameCreation > new Date(lastSnap.timestamp).getTime());

    let forwardLp = lastSnap.leaguePoints;
    for (const m of matchesAfter) {
      forwardLp += (m.me.win ? 20 : -20);
      addPoint(m.gameCreation, forwardLp, lastSnap.tier, lastSnap.rank, 'estimated');
    }

  } else {
    // No snapshots yet (First load or old data). Use Pure Reverse Inference from Current Rank (if available).
    const currentRank = summoner.ranks.find((r: any) => r.queueType === 'RANKED_SOLO_5x5');
    if (currentRank) {
      let currentLp = currentRank.leaguePoints;
      // Add current point
      addPoint(Date.now(), currentLp, currentRank.tier, currentRank.rank, 'exact');

      const matchesDesc = [...soloMatches].reverse();
      for (const m of matchesDesc) {
        const change = m.me.win ? 20 : -20;
        currentLp -= change;
        addPoint(m.gameCreation, currentLp, currentRank.tier, currentRank.rank, 'estimated');
      }
    }
  }

  // Initialize Heatmap
  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  for (let i = 119; i >= 0; i--) {
    const d = new Date(now - i * MS_PER_DAY);
    const iso = d.toISOString().slice(0, 10);
    heatmapAgg[iso] = { games: 0, wins: 0, losses: 0 };
  }

  const radarAgg = {
    gpm: 0, csm: 0, dpm: 0, dmgPercentage: 0, kda: 0, gd15: 0, csd15: 0, xpd15: 0, count: 0
  };

  const sortedMatches = [...matches].sort((a, b) => (a.gameCreation || 0) - (b.gameCreation || 0));

  for (const m of sortedMatches) {
    // Champions
    const champ = m.me?.champion?.name || m.me?.championName || 'Unknown';
    if (!championsPlayedAgg[champ]) {
      championsPlayedAgg[champ] = {
        championName: champ,
        games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0,
      };
    }
    const agg = championsPlayedAgg[champ];
    agg.games++;
    if (m.me.win) agg.wins++;
    agg.kills += m.me.kills;
    agg.deaths += m.me.deaths;
    agg.assists += m.me.assists;
    agg.damage += m.me.totalDamageDealtToChampions;

    // Heatmap
    const dayKey = new Date(m.gameCreation || 0).toISOString().slice(0, 10);
    if (heatmapAgg[dayKey]) {
      heatmapAgg[dayKey].games++;
      if (m.me.win) heatmapAgg[dayKey].wins++;
      else heatmapAgg[dayKey].losses++;
    }

    // Radar Stats
    if (m.stats && m.stats.gd15 !== 0) {
      radarAgg.gpm += m.stats.gpm;
      radarAgg.csm += m.stats.csm;
      radarAgg.dpm += m.stats.dpm;
      radarAgg.dmgPercentage += m.stats.dmgPercentage;
      radarAgg.kda += m.stats.kda;
      radarAgg.gd15 += m.stats.gd15;
      radarAgg.csd15 += m.stats.csd15;
      radarAgg.xpd15 += m.stats.xpd15;
      radarAgg.count++;
    }

    // Teammates
    for (const tm of m.teamMatesSummary || []) {
      const key = tm.summonerName; // Assuming unique by name for now, ideally puuid
      if (!teammatesMap[key]) {
        teammatesMap[key] = {
          name: tm.summonerName,
          tag: tm.tagLine || '',
          profileIconId: tm.profileIconId || 0,
          puuid: tm.puuid,
          games: 0,
          wins: 0
        };
      }
      teammatesMap[key].games++;
      if (tm.win) teammatesMap[key].wins++;
    }
  }

  const champions = Object.values(championsPlayedAgg).map((c: any, idx: number) => ({
    id: idx,
    name: c.championName,
    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.championName}.png`,
    games: c.games,
    wins: c.wins,
    losses: c.games - c.wins,
    kda: (c.kills + c.assists) / Math.max(1, c.deaths),
    kills: c.kills,
    deaths: c.deaths,
    assists: c.assists,
    damage: c.damage,
  }));

  const heatmap: HeatmapDay[] = Object.entries(heatmapAgg).map(([date, v]) => {
    const wr = v.games > 0 ? v.wins / v.games : 0;
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (v.games > 0) intensity = v.games > 2 ? (wr >= 0.4 ? 4 : 2) : (wr >= 0.4 ? 3 : 1);
    return { date, games: v.games, wins: v.wins, losses: v.losses, intensity };
  });

  const teammates: Teammate[] = Object.values(teammatesMap)
    .map((t: any) => ({
      name: t.name,
      tag: t.tag,
      profileIconId: t.profileIconId,
      games: t.games,
      wins: t.wins,
      losses: t.games - t.wins,
      winrate: Math.round((t.wins / t.games) * 100),
    }))
    .filter((t) => t.games >= 2) // Filter: Minimum 2 games
    .sort((a, b) => b.games - a.games)
    .slice(0, 20);

  const performance = radarAgg.count > 0 ? {
    gpm: radarAgg.gpm / radarAgg.count,
    csm: radarAgg.csm / radarAgg.count,
    dpm: radarAgg.dpm / radarAgg.count,
    dmgPercentage: radarAgg.dmgPercentage / radarAgg.count,
    kda: radarAgg.kda / radarAgg.count,
    gd15: radarAgg.gd15 / radarAgg.count,
    csd15: radarAgg.csd15 / radarAgg.count,
    xpd15: radarAgg.xpd15 / radarAgg.count
  } : null;

  // Final sort for LP history
  const sortedLpHistory = lpPointsTmp.sort((a: any, b: any) => {
    return (a.ts || 0) - (b.ts || 0);
  });

  return { champions, heatmap, teammates, lpHistory: sortedLpHistory, performance };
}

// Map Spell ID to Name (Simplified)
function getSpellName(id: number): string {
  const map: Record<number, string> = {
    1: 'SummonerBoost',
    3: 'SummonerExhaust',
    4: 'SummonerFlash',
    6: 'SummonerHaste',
    7: 'SummonerHeal',
    11: 'SummonerSmite',
    12: 'SummonerTeleport',
    13: 'SummonerMana',
    14: 'SummonerDot',
    21: 'SummonerBarrier',
    32: 'SummonerSnowball'
  };
  return map[id] || 'SummonerFlash';
}
