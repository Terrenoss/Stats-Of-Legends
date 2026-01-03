import { prisma } from '@/lib/prisma';
import {
    fetchMatchIds,
    riotFetchRaw,
    mapWithConcurrency,
    REGION_ROUTING,
} from './RiotService';
import { RiotMatch } from '@/types';
import { MatchProcessor } from './MatchProcessor';
import { ScoringService } from './ScoringService';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl, getRuneIconUrl, getSpellName } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';
import { getDurationBucket, calculateWeightedDeaths, calculateLaneStats, generateGraphPoints, processItemBuild } from '@/utils/matchUtils';
import { Priority } from './RiotGateway';

export class MatchHistoryService {

    static async updateMatches(puuid: string, region: string, dbSummoner: any, forceUpdate: boolean = false, priority: Priority = 'INTERACTIVE') {
        const routing = REGION_ROUTING[region];

        try {
            // SMART LOADING LOGIC
            const existingCount = await prisma.summonerMatch.count({ where: { summonerPuuid: puuid } });

            // OPTIMIZATION: Check revisionDate (Last Played)
            if (!forceUpdate && dbSummoner.lastMatchFetch && dbSummoner.revisionDate) {
                const lastFetchTime = new Date(dbSummoner.lastMatchFetch).getTime();
                const revisionTime = Number(dbSummoner.revisionDate); // BigInt to Number

                // If we fetched AFTER the last revision, we are up to date.
                // We add a small buffer (e.g., 1 minute) to be safe against clock skew.
                if (lastFetchTime > revisionTime + 60000) {
                    console.log(`[MatchHistory] Skipping update for ${puuid} (Up to date)`);
                    return;
                }
            }

            // 1. Check for NEW matches (Top of the list)
            const recentMatchIds = await fetchMatchIds(puuid, routing, 0, 20, priority);
            const existingMatches = await prisma.match.findMany({
                where: { id: { in: recentMatchIds } },
                select: { id: true },
            });
            const existingIds = new Set(existingMatches.map(m => m.id));
            const newMatchIds = recentMatchIds.filter(id => !existingIds.has(id));

            let matchesToProcess: string[] = [];

            if (existingCount === 0) {
                // FIRST LOAD: Load 10 matches immediately
                if (newMatchIds.length > 0) {
                    matchesToProcess.push(...newMatchIds.slice(0, 10));
                }
            } else if (newMatchIds.length >= 5) {
                // Scenario A: >= 5 new matches
                // Load 5 new + 5 old
                matchesToProcess.push(...newMatchIds.slice(0, 5));

                // Fetch 5 older matches (extending history)
                // We offset by existingCount + the number of new matches we detected (to skip them)
                const start = existingCount + newMatchIds.length;
                const oldMatchIds = await fetchMatchIds(puuid, routing, start, 5, priority);
                matchesToProcess.push(...oldMatchIds);
            } else if (newMatchIds.length > 0) {
                // Scenario A (Partial): < 5 new matches
                // Load all new + 5 old
                matchesToProcess.push(...newMatchIds);

                const start = existingCount + newMatchIds.length;
                const oldMatchIds = await fetchMatchIds(puuid, routing, start, 5, priority);
                matchesToProcess.push(...oldMatchIds);
            } else {
                // Scenario B: 0 new matches
                // Load 10 old matches
                const oldMatchIds = await fetchMatchIds(puuid, routing, existingCount, 10, priority);
                matchesToProcess.push(...oldMatchIds);
            }

            // Filter duplicates and already existing (for the old ones)
            matchesToProcess = Array.from(new Set(matchesToProcess));

            // Double check we don't re-process existing matches (in case offset logic overlapped)
            const alreadySaved = await prisma.match.findMany({
                where: { id: { in: matchesToProcess } },
                select: { id: true }
            });
            const alreadySavedIds = new Set(alreadySaved.map(m => m.id));
            matchesToProcess = matchesToProcess.filter(id => !alreadySavedIds.has(id));

            if (matchesToProcess.length === 0) return;

            let skippedCount = 0;

            const processMatch = async (matchId: string) => {
                try {
                    const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
                    const r = await riotFetchRaw(matchUrl, priority);
                    if (!r.ok) return null;
                    const matchData = JSON.parse(r.body || '{}');

                    // PATCH CHECK
                    const currentMajorMinor = CURRENT_PATCH.split('.').slice(0, 2).join('.');
                    const matchVersion = matchData.info.gameVersion;

                    if (!matchVersion.startsWith(currentMajorMinor)) {
                        skippedCount++;
                        return null;
                    }

                    let timelineData = null;
                    const timelineUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
                    const tRes = await riotFetchRaw(timelineUrl, priority);
                    if (tRes.ok) {
                        timelineData = JSON.parse(tRes.body || '{}');
                    }

                    if (timelineData) {
                        matchData.timeline = timelineData;
                    }

                    const m = { id: matchId, data: matchData };

                    // PROGRESSIVE LOADING: Save immediately
                    await MatchHistoryService.saveMatchAndStats(m, puuid, region, dbSummoner);

                    return m;
                } catch (e) {
                    console.error(`Failed to process match ${matchId}`, e);
                    return null;
                }
            };

            await mapWithConcurrency(matchesToProcess, 3, processMatch);

            const logMessage = skippedCount > 0
                ? `${skippedCount} match(s) ignoré(s) (Ancien Patch)`
                : null;

            await prisma.summoner.update({
                where: { puuid: puuid },
                data: {
                    lastMatchFetch: new Date(),
                    updatedAt: new Date(),
                    lastUpdateLog: logMessage
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
            const mj = sm.match.jsonData as unknown as RiotMatch;
            const formatted = await this.formatMatchData(mj, puuid, latestVersion, sm.match.averageRank);

            // LAZY BACKFILL: If Legend Score is 0, update it
            if (sm.legendScore === 0) {
                const me = formatted.participants.find((p: any) => p.puuid === puuid);
                if (me && me.legendScore > 0) {
                    // Run in background to not block response too much
                    prisma.summonerMatch.update({
                        where: { summonerPuuid_matchId: { summonerPuuid: puuid, matchId: sm.matchId } },
                        data: { legendScore: me.legendScore }
                    }).catch(err => console.error(`Failed to backfill score for ${sm.matchId}`, err));
                }
            }
            return formatted;
        }));

        return matches;
    }

    public static async saveMatchAndStats(m: any, puuid: string, region: string, dbSummoner: any, averageRank?: string) {
        const info = m.data.info;

        try {
            await prisma.match.upsert({
                where: { id: m.id },
                create: {
                    id: m.id,
                    gameCreation: new Date(info.gameStartTimestamp),
                    gameDuration: info.gameDuration,
                    gameMode: info.gameMode,
                    gameVersion: info.gameVersion,
                    jsonData: m.data,
                    averageRank: averageRank || undefined,
                },
                update: {
                    averageRank: averageRank || undefined,
                },
            });
        } catch (e: any) {
            // P2002: Unique constraint failed. 
            // This means another thread saved the match just now. We can ignore it.
            if (e.code !== 'P2002') {
                throw e;
            }
        }

        // Calculate Legend Scores for all participants before saving
        // We need to process the match data to get the scores
        // We can reuse formatMatchData logic or call ScoringService directly if we have enough data.
        // Since formatMatchData is complex and requires fetching extra data (runes, etc.), 
        // we might want to do a simplified calculation or reuse the existing flow.

        // Better approach: We already have the full match data in 'm.data'.
        // We can use MatchHistoryService.formatMatchData to get the calculated scores.
        // However, formatMatchData is static and might be heavy.
        // Let's try to calculate it using the same logic as in formatMatchData but optimized?
        // Or just call formatMatchData since we are in background job usually?
        // Actually, saveMatchAndStats is called during updateMatches.

        // Let's use formatMatchData to get the scores. It returns 'participants' with 'legendScore'.
        const formattedMatch = await MatchHistoryService.formatMatchData(m.data, puuid, m.data.info.gameVersion, null);

        for (const p of formattedMatch.participants) {
            if (p.puuid === puuid) {
                await prisma.summonerMatch.upsert({
                    where: { summonerPuuid_matchId: { summonerPuuid: puuid, matchId: m.id } },
                    create: {
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
                        legendScore: p.legendScore || 0,
                    },
                    update: {
                        legendScore: p.legendScore || 0 // Update score if it changed (e.g. backfill)
                    }
                });
            }
        }

        // OPTIMIZATION: Process for Tier List immediately
        try {
            const ranks = dbSummoner?.ranks || [];
            const solo = ranks.find((r: any) => r.queueType === 'RANKED_SOLO_5x5');
            const flex = ranks.find((r: any) => r.queueType === 'RANKED_FLEX_SR');
            const tier = averageRank || solo?.tier || flex?.tier || 'EMERALD';

            await MatchProcessor.processMatch(m.id, region, tier, m.data);
        } catch (err) {
            console.error(`Background processing failed for ${m.id}`, err);
        }
    }

    // --- Helper Functions (Moved from route.ts) ---

    private static runesCache: any = null;
    private static async getRunesData(version: string) {
        if (this.runesCache) return this.runesCache;
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`, { next: { revalidate: 86400 } } as any);
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
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`, { next: { revalidate: 86400 } } as any);
            if (res.ok) {
                const matchData = await res.json();
                this.spellsCache = matchData.data; // The 'data' property contains the map
                return this.spellsCache;
            }
        } catch (e) {
            console.error('Failed to fetch summoner spells:', e);
        }
        return {};
    }

    private static getRunesDetailed(perks: any, runesData: any[]) {
        if (!perks || !runesData) return { primary: null, secondary: null };

        const styles = perks.styles || [];
        const primaryStyle = styles.find((s: any) => s.description === 'primaryStyle');
        const subStyle = styles.find((s: any) => s.description === 'subStyle');
        const statPerks = perks.statPerks || {};

        let primaryImg = null;
        let secondaryImg = null;
        let primarySelections: any[] = [];
        let subSelections: any[] = [];

        // Helper to find rune in tree
        const findRune = (id: number, styleId: number) => {
            const style = runesData.find((r: any) => r.id === styleId);
            if (!style || !style.slots) return null;
            for (const slot of style.slots) {
                const rune = slot.runes.find((r: any) => r.id === id);
                if (rune) return { ...rune, icon: getRuneIconUrl(rune.icon) };
            }
            return null;
        };

        if (primaryStyle) {
            const styleData = runesData.find((r: any) => r.id === primaryStyle.style);
            if (styleData && styleData.slots && styleData.slots[0]) {
                const keystoneId = primaryStyle.selections[0].perk;
                const keystoneData = styleData.slots[0].runes.find((r: any) => r.id === keystoneId);
                if (keystoneData) {
                    primaryImg = getRuneIconUrl(keystoneData.icon);
                }
            }
            // Get all primary selections
            primarySelections = primaryStyle.selections.map((s: any) => {
                const r = findRune(s.perk, primaryStyle.style);
                return r ? { id: s.perk, icon: r.icon, name: r.name } : { id: s.perk, icon: '' };
            });
        }

        if (subStyle) {
            const styleData = runesData.find((r: any) => r.id === subStyle.style);
            if (styleData) {
                secondaryImg = getRuneIconUrl(styleData.icon);
            }
            // Get all sub selections
            subSelections = subStyle.selections.map((s: any) => {
                const r = findRune(s.perk, subStyle.style);
                return r ? { id: s.perk, icon: r.icon, name: r.name } : { id: s.perk, icon: '' };
            });
        }

        // Stat Perks Mapping
        const STAT_PERKS_MAP: Record<number, string> = {
            5001: 'perk-images/StatMods/StatModsHealthScalingIcon.png',
            5002: 'perk-images/StatMods/StatModsArmorIcon.png',
            5003: 'perk-images/StatMods/StatModsMagicResIcon.png',
            5005: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
            5007: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
            5008: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png'
        };

        const getStatPerk = (id: number) => ({
            id,
            icon: STAT_PERKS_MAP[id] ? getRuneIconUrl(STAT_PERKS_MAP[id]) : ''
        });

        return {
            primary: primaryImg,
            secondary: secondaryImg,
            primaryStyleId: primaryStyle?.style,
            subStyleId: subStyle?.style,
            subStyleIcon: secondaryImg, // Add this line
            primarySelections,
            subSelections,
            statPerks: {
                offense: statPerks.offense ? getStatPerk(statPerks.offense) : null,
                flex: statPerks.flex ? getStatPerk(statPerks.flex) : null,
                defense: statPerks.defense ? getStatPerk(statPerks.defense) : null
            }
        };
    }

    public static async formatMatchData(mj: RiotMatch, puuid: string, version: string, averageRank?: string | null) {
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
        const durationBucket = getDurationBucket(duration);
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
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`, { next: { revalidate: 86400 } } as any);
            if (res.ok) {
                const json = await res.json();
                championData = json.data;
            }
        } catch (e) {
            console.error('Failed to fetch champion data:', e);
        }

        // Timeline processing
        const { timelineData, itemBuild, ace, participantLaneStats, participantWeightedDeaths } = this.getTimelineStats(timelineJson, me, version, participants);



        const mappedParticipants = participants.map((p: any) => {
            const pCs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
            const runes = this.getRunesDetailed(p.perks, runesData);

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
                scoreResult = ScoringService.calculateScore({
                    participant: { ...p, challenges: p.challenges },
                    duration: (info.gameDuration || 1) / 60,
                    championStats: pChampStats,
                    matchupStats: pMatchupStats,
                    teamStats: teamStats[p.teamId],
                    laneStats: laneStats,
                    averageRank: undefined,
                    matchupWinRate: matchupWinRate,
                    championClass: championClass,
                    weightedDeaths: weightedDeaths
                });
            }

            // V5: Calculate Role Average Performance (Relative to Champion)
            let roleAveragePerformance = undefined;
            if (pRoleStats && pChampStats) {
                const getZ = (roleVal: number, champVal: number, stdDevMult: number = 0.4) => {
                    const stdDev = Math.max(champVal * stdDevMult, 0.1);
                    return (roleVal - champVal) / stdDev;
                };

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

            const teamKills = teamStats[p.teamId]?.kills || 0;
            const kp = teamKills > 0 ? ((Number(p.kills) + Number(p.assists)) / teamKills) * 100 : 0;
            const durationMin = (info.gameDuration || 1) / 60;

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
                killParticipation: kp,
                damagePerMin: (p.totalDamageDealtToChampions || 0) / durationMin,
                goldPerMin: (p.goldEarned || 0) / durationMin,
                csPerMin: pCs / durationMin,
                damage: p.totalDamageDealtToChampions || 0,
                gold: p.goldEarned || 0,
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
        let itemBuild: any[] = [];
        let ace = false;
        let participantLaneStats: Record<number, { csd15: number; gd15: number; xpd15: number }> = {};
        let participantWeightedDeaths: Record<number, number> = {};

        if (timelineJson) {
            const frames = timelineJson.info?.frames || [];
            const events = frames.flatMap((f: any) => f.events || []);
            const myAce = events.find((e: any) => e.type === 'CHAMPION_KILL' && e.ace === true && e.killerId === me.participantId);
            if (myAce) ace = true;

            // Weighted Deaths
            participantWeightedDeaths = calculateWeightedDeaths(events);

            // Lane Stats
            participantLaneStats = calculateLaneStats(frames, participants);

            // Graph Points
            const points = generateGraphPoints(frames);
            if (points.length) timelineData = points;

            // Item Build
            itemBuild = processItemBuild(events, me, version, getItemIconUrl);
        }

        return { timelineData, itemBuild, ace, participantLaneStats, participantWeightedDeaths };
    }
}
