import { prisma } from '@/lib/prisma';
import {
    fetchMatchIds,
    riotFetchRaw,
    mapWithConcurrency,
    REGION_ROUTING,
} from './RiotService';
import { MatchProcessor } from './MatchProcessor';
import { ScoringService } from './ScoringService';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl, getRuneIconUrl, getSpellName } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

export class MatchHistoryService {

    static async updateMatches(puuid: string, region: string, dbSummoner: any) {
        const routing = REGION_ROUTING[region];

        try {
            const matchIds = await fetchMatchIds(puuid, routing, 0, 60);

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
                                totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
                                totalMinionsKilled: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
                                goldEarned: p.goldEarned || 0,
                                visionScore: p.visionScore || 0,
                                items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
                            }
                        });
                    }
                }

                // OPTIMIZATION: Process for Tier List immediately
                try {
                    const ranks = dbSummoner?.ranks || [];
                    const solo = ranks.find((r: any) => r.queueType === 'RANKED_SOLO_5x5');
                    const flex = ranks.find((r: any) => r.queueType === 'RANKED_FLEX_SR');
                    const tier = solo?.tier || flex?.tier || 'EMERALD';

                    await MatchProcessor.processMatch(m.id, region, tier, m.data);
                } catch (err) {
                    console.error(`Background processing failed for ${m.id}`, err);
                }
            }

            await prisma.summoner.update({
                where: { puuid: puuid },
                data: {
                    lastMatchFetch: new Date(),
                    updatedAt: new Date()
                },
            });

        } catch (err) {
            console.error('Error updating matches:', err);
        }
    }

    static async getMatchesForDisplay(puuid: string, count: number = 60) {
        const summonerMatches = await prisma.summonerMatch.findMany({
            where: { summonerPuuid: puuid },
            include: { match: true },
            orderBy: { match: { gameCreation: 'desc' } },
            take: count,
        });

        const latestVersion = CURRENT_PATCH;

        const matches = await Promise.all(summonerMatches.map(async (sm) => {
            const mj = sm.match.jsonData as any;
            return this.formatMatchData(mj, puuid, latestVersion, (sm.match as any).averageRank);
        }));

        return matches;
    }

    // --- Helper Functions (Moved from route.ts) ---

    private static runesCache: any = null;
    private static async getRunesData(version: string) {
        if (this.runesCache) return this.runesCache;
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`, { next: { revalidate: 86400 } });
            if (res.ok) {
                this.runesCache = await res.json();
                return this.runesCache;
            }
        } catch (e) {
            console.error('Failed to fetch runes:', e);
        }
        return [];
    }

    private static spellsCache: any = null;
    private static async getSummonerSpellsData(version: string) {
        if (this.spellsCache) return this.spellsCache;
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`, { next: { revalidate: 86400 } });
            if (res.ok) {
                const data = await res.json();
                this.spellsCache = data.data; // The 'data' property contains the map
                return this.spellsCache;
            }
        } catch (e) {
            console.error('Failed to fetch summoner spells:', e);
        }
        return {};
    }

    private static getRuneImages(perks: any, runesData: any[]) {
        if (!perks || !runesData) return { primary: null, secondary: null };

        const styles = perks.styles || [];
        const primaryStyle = styles.find((s: any) => s.description === 'primaryStyle');
        const subStyle = styles.find((s: any) => s.description === 'subStyle');

        let primaryImg = '';
        let secondaryImg = '';

        if (primaryStyle && primaryStyle.selections && primaryStyle.selections.length > 0) {
            const keystoneId = primaryStyle.selections[0].perk;
            const styleData = runesData.find((r: any) => r.id === primaryStyle.style);
            if (styleData && styleData.slots && styleData.slots[0]) {
                const keystoneData = styleData.slots[0].runes.find((r: any) => r.id === keystoneId);
                if (keystoneData) {
                    primaryImg = getRuneIconUrl(keystoneData.icon);
                }
            }
        }

        if (subStyle) {
            const styleData = runesData.find((r: any) => r.id === subStyle.style);
            if (styleData) {
                secondaryImg = getRuneIconUrl(styleData.icon);
            }
        }

        return { primary: primaryImg, secondary: secondaryImg };
    }

    private static async formatMatchData(mj: any, puuid: string, version: string, averageRank?: string | null) {
        const info = mj.info;
        const participants = info.participants;
        const me = participants.find((p: any) => p.puuid === puuid);

        const timelineJson = mj.timeline;
        const runesData = await this.getRunesData(version);
        const spellsData = await this.getSummonerSpellsData(version);

        // Create reverse map for spells (Key -> ID)
        const spellIdToName: Record<string, string> = {};
        if (spellsData) {
            Object.values(spellsData).forEach((spell: any) => {
                spellIdToName[spell.key] = spell.id;
            });
        }

        // Helper to get spell name safely
        const getSpellNameSafe = (id: number) => {
            return spellIdToName[String(id)] || getSpellName(id);
        };

        // V5: Check Cache (MatchAnalysis)
        let cachedScores: Record<string, any> | null = null;
        try {
            // @ts-ignore
            const cachedAnalysis = await prisma.matchAnalysis.findUnique({
                where: { matchId: mj.metadata.matchId }
            });
            if (cachedAnalysis && cachedAnalysis.jsonResult && cachedAnalysis.version === "6.0") {
                cachedScores = cachedAnalysis.jsonResult as Record<string, any>;
            }
        } catch (e) {
            // Ignore cache errors
        }

        // Calculate Team Totals for Shares
        const teamStats: Record<number, { damage: number; gold: number; kills: number }> = {
            100: { damage: 0, gold: 0, kills: 0 },
            200: { damage: 0, gold: 0, kills: 0 }
        };

        participants.forEach((p: any) => {
            const tid = p.teamId;
            teamStats[tid].damage += (p.totalDamageDealtToChampions || 0);
            teamStats[tid].gold += (p.goldEarned || 0);
            teamStats[tid].kills += (p.kills || 0);
        });

        const myTeamStats = teamStats[me.teamId] || { damage: 1, gold: 1, kills: 1 };
        const cs = (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0);

        const stats: any = {
            gpm: (me.goldEarned || 0) / ((info.gameDuration || 1) / 60),
            csm: cs / ((info.gameDuration || 1) / 60),
            dpm: (me.totalDamageDealtToChampions || 0) / ((info.gameDuration || 1) / 60),
            dmgPercentage: ((me.totalDamageDealtToChampions || 0) / Math.max(1, myTeamStats.damage)) * 100,
            kda: (me.kills + me.assists) / Math.max(1, me.deaths),
            gd15: 0, csd15: 0, xpd15: 0
        };

        // V2: Fetch Baselines
        const duration = info.gameDuration || 0;
        const durationBucket = duration < 1200 ? "0-20" : duration < 1800 ? "20-30" : "30+";
        const tier = averageRank ? averageRank.split(' ')[0] : 'EMERALD';

        // Bulk fetch champion stats
        const championNames = participants.map((p: any) => p.championName);
        const dbChampStats = await prisma.championStat.findMany({
            where: {
                championId: { in: championNames },
                tier: tier,
                patch: version.split('.').slice(0, 2).join('.'),
                durationBucket: durationBucket,
            }
        });

        // V5: Fetch Role Averages (Aggregated)
        const roleAggregates = await prisma.championStat.groupBy({
            by: ['role'],
            where: {
                tier: tier,
                patch: version.split('.').slice(0, 2).join('.'),
                durationBucket: durationBucket,
            },
            _sum: {
                matches: true,
                totalKills: true,
                totalDeaths: true,
                totalAssists: true,
                totalDamage: true,
                totalGold: true,
                totalCs: true,
                totalVision: true,
                totalObjectiveParticipation: true,
                totalDuration: true
            }
        });

        const roleStatsMap: Record<string, any> = {};
        roleAggregates.forEach((r: any) => {
            const m = r._sum.matches || 1;
            const d = (r._sum.totalDuration || 1) / 60; // Total minutes across all matches
            roleStatsMap[r.role] = {
                kda: (r._sum.totalKills + r._sum.totalAssists) / Math.max(1, r._sum.totalDeaths),
                damage: r._sum.totalDamage / d, // DPM
                gold: r._sum.totalGold / d, // GPM
                cs: r._sum.totalCs / d, // CSM
                vision: r._sum.totalVision / d, // VSPM
                objective: r._sum.totalObjectiveParticipation / m,
                utility: 5 // Default utility for role avg (hard to aggregate)
            };
        });

        // Fetch Matchup Stats for ME
        let myMatchupStats = null;
        const myOpponent = participants.find((p: any) => p.teamPosition === me.teamPosition && p.teamId !== me.teamId);
        if (myOpponent) {
            myMatchupStats = await prisma.matchupStat.findUnique({
                where: {
                    championId_opponentId_role_tier_patch_durationBucket: {
                        championId: me.championName,
                        opponentId: myOpponent.championName,
                        role: me.teamPosition || 'MID',
                        tier: tier,
                        patch: version.split('.').slice(0, 2).join('.'),
                        durationBucket: durationBucket
                    }
                }
            });
        }

        // Fetch Champion Data for Tags (Classes)
        let championData: any = {};
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`, { next: { revalidate: 86400 } });
            if (res.ok) {
                const json = await res.json();
                championData = json.data;
            }
        } catch (e) {
            console.error('Failed to fetch champion data:', e);
        }

        // Timeline processing
        const { timelineData, itemBuild, ace, participantLaneStats, participantWeightedDeaths } = this.getTimelineStats(timelineJson, me, version, participants);

        const t100Kills = participants.filter((p: any) => p.teamId === 100).reduce((a: number, b: any) => a + b.kills, 0);
        const t200Kills = participants.filter((p: any) => p.teamId === 200).reduce((a: number, b: any) => a + b.kills, 0);

        const mappedParticipants = participants.map((p: any) => {
            const pCs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
            const runes = this.getRuneImages(p.perks, runesData);

            const pRole = p.teamPosition || 'MID';
            const pChampStats = dbChampStats.find(s => s.championId === p.championName && s.role === pRole);
            const pMatchupStats = (p.puuid === puuid) ? myMatchupStats : null;
            const pRoleStats = roleStatsMap[pRole];

            const matchupWinRate = (pMatchupStats && pMatchupStats.matches > 0)
                ? (pMatchupStats.wins / pMatchupStats.matches)
                : undefined;

            const laneStats = (timelineJson && participantLaneStats[p.participantId])
                ? participantLaneStats[p.participantId]
                : undefined;

            const champInfo = championData[p.championName];
            const championClass = champInfo?.tags?.[0] || 'Fighter';
            const weightedDeaths = participantWeightedDeaths[p.participantId];

            let scoreResult;

            if (cachedScores && cachedScores[p.puuid]) {
                scoreResult = cachedScores[p.puuid];
            } else {
                scoreResult = ScoringService.calculateScore(
                    { ...p, challenges: p.challenges },
                    (info.gameDuration || 1) / 60,
                    pChampStats,
                    pMatchupStats,
                    teamStats[p.teamId],
                    laneStats,
                    undefined,
                    matchupWinRate,
                    championClass,
                    weightedDeaths
                );
            }

            // V5: Calculate Role Average Performance (Relative to Champion)
            // We want to know: How does the "Average Role Player" perform compared to "Average Champion Player"?
            // If RoleAvg > ChampAvg, it means this champion is generally weaker than the role average.
            let roleAveragePerformance = undefined;
            if (pRoleStats && pChampStats) {
                // Helper to calculate Z-score of RoleAvg using ChampAvg as baseline
                const getZ = (roleVal: number, champVal: number, stdDevMult: number = 0.4) => {
                    const stdDev = Math.max(champVal * stdDevMult, 0.1);
                    return (roleVal - champVal) / stdDev;
                };

                // Champ Baselines
                const cStats = pChampStats as any;
                const cDpm = cStats.totalDamage / ((cStats.totalDuration || 1) / 60);
                const cGpm = cStats.totalGold / ((cStats.totalDuration || 1) / 60);
                const cCsm = cStats.totalCs / ((cStats.totalDuration || 1) / 60);
                const cVis = cStats.totalVision / ((cStats.totalDuration || 1) / 60);
                const cKda = (cStats.totalKills + cStats.totalAssists) / Math.max(1, cStats.totalDeaths);
                const cObj = cStats.totalObjectiveParticipation / cStats.matches;

                roleAveragePerformance = {
                    damage: getZ(pRoleStats.damage, cDpm),
                    gold: getZ(pRoleStats.gold, cGpm),
                    cs: getZ(pRoleStats.cs, cCsm),
                    vision: getZ(pRoleStats.vision, cVis),
                    kda: getZ(pRoleStats.kda, cKda),
                    objective: getZ(pRoleStats.objective, cObj),
                    lane: 0,
                    utility: 0
                };
            }

            const legendScore = scoreResult.score;

            return {
                ...p,
                champion: {
                    id: p.championId,
                    name: p.championName,
                    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${p.championName}.png`,
                },
                summonerName: p.riotIdGameName || p.summonerName || 'Unknown',
                tagLine: p.riotIdTagline || p.riotIdTagLine || '',
                profileIconId: p.profileIcon || p.profileIconId || 0,
                puuid: p.puuid,
                teamId: p.teamId,
                win: p.win,
                kda: `${p.kills}/${p.deaths}/${p.assists}`,
                cs: pCs,
                level: p.champLevel || 0,
                visionScore: p.visionScore,
                items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id) => ({
                    id,
                    imageUrl: getItemIconUrl(id, version),
                })),
                runes: runes,
                spells: [
                    { id: p.summoner1Id, imageUrl: getSpellIconUrl(getSpellNameSafe(p.summoner1Id), version) },
                    { id: p.summoner2Id, imageUrl: getSpellIconUrl(getSpellNameSafe(p.summoner2Id), version) },
                ],
                legendScore: legendScore,
                legendScoreGrade: scoreResult.grade,
                legendScoreBreakdown: scoreResult.breakdown,
                legendScoreComparison: scoreResult.comparison,
                legendScoreContribution: scoreResult.contribution,
                legendScoreSampleSize: scoreResult.sampleSize,
                roleAveragePerformance: roleAveragePerformance
            };
        });

        const sortedByScore = [...mappedParticipants].sort((a: any, b: any) => b.legendScore - a.legendScore);
        mappedParticipants.forEach((p: any) => {
            const rank = sortedByScore.findIndex((x: any) => x.puuid === p.puuid) + 1;
            p.legendScoreRank = rank;
        });

        const mappedMe = mappedParticipants.find((p: any) => p.puuid === puuid) || mappedParticipants[0];

        const team = mappedParticipants
            .filter((p: any) => p.teamId === mappedMe.teamId && p.puuid !== puuid)
            .map((p: any) => ({
                summonerName: p.summonerName || 'Unknown',
                tagLine: p.tagLine || 'RIOT',
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

        // V5: Save to Cache (Fire and Forget)
        if (!cachedScores) {
            const cacheData: Record<string, any> = {};
            mappedParticipants.forEach((p: any) => {
                cacheData[p.puuid] = {
                    score: p.legendScore,
                    grade: p.legendScoreGrade,
                    breakdown: p.legendScoreBreakdown,
                    comparison: p.legendScoreComparison,
                    contribution: p.legendScoreContribution,
                    sampleSize: p.legendScoreSampleSize
                };
            });

            // @ts-ignore
            prisma.matchAnalysis.upsert({
                where: { matchId: mj.metadata.matchId },
                update: { jsonResult: cacheData, version: "6.0" },
                create: { matchId: mj.metadata.matchId, jsonResult: cacheData, version: "6.0" }
            }).catch(err => console.error("Failed to save match analysis cache:", err));
        }

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

    private static getTimelineStats(timelineJson: any, me: any, version: string, participants: any[]) {
        let timelineData = null;
        const itemBuild: any[] = [];
        let ace = false;
        const participantLaneStats: Record<number, { csd15: number; gd15: number; xpd15: number }> = {};
        const participantWeightedDeaths: Record<number, number> = {};

        if (timelineJson) {
            const frames = timelineJson.info?.frames || [];
            const events = frames.flatMap((f: any) => f.events || []);
            const myAce = events.find((e: any) => e.type === 'CHAMPION_KILL' && e.ace === true && e.killerId === me.participantId);
            if (myAce) ace = true;

            // Weighted Deaths
            const deathEvents = events.filter((e: any) => e.type === 'CHAMPION_KILL');
            deathEvents.forEach((e: any) => {
                const victimId = e.victimId;
                const timestamp = e.timestamp;
                const minutes = timestamp / 60000;

                let weight = 1.0;
                if (minutes < 15) weight = 0.8;
                else if (minutes < 30) weight = 1.0;
                else weight = 1.5;

                if (!participantWeightedDeaths[victimId]) participantWeightedDeaths[victimId] = 0;
                participantWeightedDeaths[victimId] += weight;
            });

            const frame15 = frames.find((f: any) => f.timestamp >= 900000 && f.timestamp < 960000) || frames[frames.length - 1];

            if (frame15) {
                participants.forEach((p: any) => {
                    const opponent = participants.find((opp: any) => opp.teamPosition === p.teamPosition && opp.teamId !== p.teamId);
                    if (opponent) {
                        const myFrame = frame15.participantFrames?.[p.participantId];
                        const oppFrame = frame15.participantFrames?.[opponent.participantId];
                        if (myFrame && oppFrame) {
                            participantLaneStats[p.participantId] = {
                                gd15: (myFrame.totalGold || 0) - (oppFrame.totalGold || 0),
                                xpd15: (myFrame.xp || 0) - (oppFrame.xp || 0),
                                csd15: ((myFrame.minionsKilled || 0) + (myFrame.jungleMinionsKilled || 0)) - ((oppFrame.minionsKilled || 0) + (oppFrame.jungleMinionsKilled || 0))
                            };
                        }
                    }
                });
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

        return { timelineData, itemBuild, ace, participantLaneStats, participantWeightedDeaths };
    }
}

