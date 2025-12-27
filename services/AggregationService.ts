import { Participant } from '../types';

export class AggregationService {
    static calculateAggregations(matches: any[], summoner: any, version: string) {
        const championsMap = new Map<string, any>();
        const teammatesMap = new Map<string, any>();
        const heatmapData: Record<string, { count: number; wins: number; losses: number }> = {};
        const lpHistory: any[] = [];

        // Performance Radar Data
        const performance: any = {
            combat: 0,
            objectives: 0,
            vision: 0,
            farming: 0,
            survival: 0,
        };

        let totalScore = 0;
        let scoreCount = 0;
        const scores: number[] = [];

        matches.forEach(match => {
            const me = match.me;
            if (!me) return;

            // Champions
            const champName = me.champion.name;
            if (!championsMap.has(champName)) {
                championsMap.set(champName, {
                    id: me.champion.id,
                    name: champName,
                    imageUrl: me.champion.imageUrl,
                    matches: 0,
                    wins: 0,
                    kills: 0,
                    deaths: 0,
                    assists: 0,
                    cs: 0,
                    gold: 0,
                    damage: 0,
                });
            }
            const champ = championsMap.get(champName);
            champ.matches++;
            if (me.win) champ.wins++;
            champ.kills += me.kills;
            champ.deaths += me.deaths;
            champ.assists += me.assists;
            champ.cs += me.cs;
            champ.gold += me.goldEarned;
            champ.damage += me.totalDamageDealtToChampions;

            // Teammates (Limit to last 20 matches for performance)
            if (matches.indexOf(match) < 20 && match.teamMatesSummary && Array.isArray(match.teamMatesSummary)) {
                match.teamMatesSummary.forEach((tm: any) => {
                    const key = `${tm.summonerName}#${tm.tagLine}`;
                    if (!teammatesMap.has(key)) {
                        teammatesMap.set(key, {
                            summonerName: tm.summonerName,
                            tagLine: tm.tagLine,
                            matches: 0,
                            wins: 0,
                            puuid: tm.puuid,
                            profileIconId: tm.profileIconId
                        });
                    }
                    const t = teammatesMap.get(key);
                    t.matches++;
                    if (tm.win) t.wins++;
                });
            }

            // Heatmap
            const creation = new Date(match.gameCreation);
            if (!isNaN(creation.getTime())) {
                const date = creation.toISOString().split('T')[0];
                if (!heatmapData[date]) heatmapData[date] = { count: 0, wins: 0, losses: 0 };
                heatmapData[date].count++;
                if (me.win) heatmapData[date].wins++;
                else heatmapData[date].losses++;
            }

            // Performance
            if (me.legendScoreBreakdown) {
                performance.combat += me.legendScoreBreakdown.damage || 0;
                performance.objectives += me.legendScoreBreakdown.objective || 0;
                performance.vision += me.legendScoreBreakdown.vision || 0;
                performance.farming += me.legendScoreBreakdown.cs || 0;
                performance.survival += me.legendScoreBreakdown.kda || 0;
                totalScore += me.legendScore;
                scoreCount++;
                scores.push(me.legendScore);
            }
        });

        // Normalize Performance & Convert Z-Score to 0-100 Scale
        if (scoreCount > 0) {
            const zToScore = (z: number) => Math.max(0, Math.min(100, 50 + (z * 20)));

            performance.combat = zToScore(performance.combat / scoreCount);
            performance.objectives = zToScore(performance.objectives / scoreCount);
            performance.vision = zToScore(performance.vision / scoreCount);
            performance.farming = zToScore(performance.farming / scoreCount);
            performance.survival = zToScore(performance.survival / scoreCount);
        }

        // Consistency Badge
        let consistencyBadge = 'Average';
        if (scores.length >= 5) {
            const mean = totalScore / scoreCount;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scoreCount;
            const stdDev = Math.sqrt(variance);

            if (stdDev < 8) consistencyBadge = 'Rock Solid';
            else if (stdDev > 18) consistencyBadge = 'Coinflip';
        }
        performance.consistencyBadge = consistencyBadge;


        // LP History (Filter for SOLO queue only)
        if (summoner.snapshots) {
            summoner.snapshots
                .filter((s: any) => s.queueType === 'RANKED_SOLO_5x5')
                .forEach((s: any) => {
                    lpHistory.push({
                        date: s.timestamp.toISOString().split('T')[0],
                        lp: s.leaguePoints,
                        tier: s.tier,
                        rank: s.rank
                    });
                });
        }

        // Fill Heatmap for last 120 days
        const heatmap = [];
        const today = new Date();
        for (let i = 119; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = heatmapData[dateStr] || { count: 0, wins: 0, losses: 0 };

            let intensity = 0;
            if (dayData.count > 0) {
                const wr = dayData.wins / dayData.count;
                if (dayData.count < 3) {
                    intensity = wr >= 0.5 ? 2 : 1;
                } else {
                    if (wr < 0.4) intensity = 2;
                    else if (wr <= 0.6) intensity = 3;
                    else intensity = 4;
                }
            }

            heatmap.push({
                date: dateStr,
                games: dayData.count,
                wins: dayData.wins,
                losses: dayData.losses,
                intensity
            });
        }

        return {
            champions: Array.from(championsMap.values()).map(c => ({
                ...c,
                games: c.matches,
                kda: (c.kills + c.assists) / Math.max(1, c.deaths)
            })).sort((a, b) => b.matches - a.matches).slice(0, 5),
            heatmap,
            teammates: Array.from(teammatesMap.values()).map(t => ({
                name: t.summonerName,
                tag: t.tagLine,
                profileIconId: t.profileIconId,
                wins: t.wins,
                losses: t.matches - t.wins,
                winrate: Math.round((t.wins / t.matches) * 100),
                games: t.matches
            })).sort((a, b) => b.games - a.games).slice(0, 5),
            lpHistory,
            performance
        };
    }
}
