import { Participant } from '../types';
import { MLService } from './MLService';

export interface ScoreResult {
    score: number; // 0-10
    grade: string; // S+, S, A, B, C, D
    breakdown: {
        kda: number;
        damage: number;
        gold: number;
        vision: number;
        cs: number;
        objective: number;
        utility: number;
        lane?: number;
    };
    comparison: 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'POOR';
    contribution?: number; // Marginal Win Probability Contribution
    sampleSize?: number; // N for confidence
}

// Weights per Role
const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
    TOP: { damage: 0.20, gold: 0.15, cs: 0.15, kda: 0.15, vision: 0.10, objective: 0.10, utility: 0.15 },
    JUNGLE: { objective: 0.20, kda: 0.15, vision: 0.20, damage: 0.15, gold: 0.10, cs: 0.05, utility: 0.15 },
    MID: { damage: 0.25, gold: 0.20, kda: 0.20, cs: 0.15, vision: 0.10, objective: 0.05, utility: 0.05 },
    ADC: { damage: 0.30, gold: 0.25, cs: 0.20, kda: 0.15, objective: 0.05, vision: 0.05, utility: 0.00 },
    SUPPORT: { vision: 0.25, kda: 0.15, objective: 0.15, utility: 0.30, damage: 0.10, gold: 0.05, cs: 0.00 },
};

// Fallback if role is unknown
const DEFAULT_WEIGHTS = { damage: 0.20, gold: 0.20, kda: 0.20, cs: 0.20, vision: 0.10, objective: 0.10, utility: 0.00 };

// Class Modifiers (Multipliers to Role Weights)
const CLASS_MODIFIERS: Record<string, Record<string, number>> = {
    Mage: { damage: 1.2, utility: 0.8, vision: 1.0 },
    Assassin: { damage: 1.3, kda: 1.2, utility: 0.5, vision: 0.8 },
    Tank: { damage: 0.7, utility: 1.5, kda: 1.0, vision: 1.0 },
    Fighter: { damage: 1.1, utility: 0.9, kda: 1.0 },
    Marksman: { damage: 1.3, gold: 1.2, utility: 0.5 },
    Support: { utility: 1.3, vision: 1.2, damage: 0.7 }
};

export class ScoringService {

    /**
     * Calculates the Legend Score (0-10) for a participant.
     * @param p The participant data
     * @param duration Game duration in minutes
     * @param championStats Aggregated stats for this champion (Baseline)
     * @param matchupStats Aggregated stats for this matchup (Specific Baseline)
     * @param teamStats Team totals
     * @param laneStats Lane diffs @ 15
     * @param averageRank Match average rank
     * @param matchupWinRate Winrate of the matchup
     * @param championClass Champion class (e.g. "Mage", "Tank")
     * @param weightedDeaths Deaths weighted by game time
     */
    static calculateScore(
        p: Participant,
        duration: number,
        championStats?: any,
        matchupStats?: any,
        teamStats?: { damage: number; gold: number; kills: number },
        laneStats?: { csd15: number; gd15: number; xpd15: number },
        averageRank?: string,
        matchupWinRate?: number,
        championClass?: string,
        weightedDeaths?: number
    ): ScoreResult {
        const role = p.teamPosition || 'MID';
        let weights = { ...(ROLE_WEIGHTS[role] || DEFAULT_WEIGHTS) };

        // V4: Apply Class Modifiers
        if (championClass && CLASS_MODIFIERS[championClass]) {
            const mods = CLASS_MODIFIERS[championClass];
            Object.keys(mods).forEach(key => {
                if (weights[key]) weights[key] *= mods[key];
            });
        }

        // Helper: Shrinkage (Empirical Bayes)
        const shrinkMean = (sampleMean: number, globalMean: number, n: number, k: number = 10) => {
            if (n === 0) return globalMean;
            const alpha = n / (n + k);
            return alpha * sampleMean + (1 - alpha) * globalMean;
        };

        // Helper: Percentile Mapping (Logistic Approximation of CDF)
        const getPercentile = (z: number) => {
            return 1 / (1 + Math.exp(-1.7 * z));
        };

        // 1. Calculate Player Stats & Shares
        const myTeamDamage = teamStats?.damage || 1;
        const myTeamGold = teamStats?.gold || 1;

        // V4: Use Weighted Deaths if available, otherwise raw deaths
        const effectiveDeaths = weightedDeaths !== undefined ? weightedDeaths : p.deaths;

        const stats = {
            kda: (p.kills + p.assists) / Math.max(1, effectiveDeaths),
            damageShare: (p.totalDamageDealtToChampions || 0) / Math.max(1, myTeamDamage),
            damagePerMin: (p.totalDamageDealtToChampions || 0) / duration,
            goldShare: (p.goldEarned || 0) / Math.max(1, myTeamGold),
            goldPerMin: (p.goldEarned || 0) / duration,
            cs: ((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)) / duration,
            vision: p.visionScore / duration,
            objective: (p.challenges?.dragonTakedowns || 0) +
                (p.challenges?.baronTakedowns || 0) +
                (p.challenges?.turretTakedowns || 0) +
                (p.challenges?.inhibitorTakedowns || 0),
            utility: ((p.timeCCingOthers || 0) / duration) +
                (((p.totalHealsOnTeammates || 0) + (p.totalDamageShieldedOnTeammates || 0)) / 1000)
        };

        // 2. Determine Baselines (Prioritize Matchup Specific)
        // Default Baselines (if no data at all)
        const defaults = {
            kda: 3.0,
            damage: 600,
            gold: 400,
            cs: 6.0,
            vision: 1.0,
            objective: 0
        };

        // Helper to get baseline mean
        const getBaselineMean = (key: string, totalKey: string, shareKey?: string) => {
            // Global Mean (Champion Stats)
            let globalMean = defaults[key as keyof typeof defaults];
            if (championStats && championStats.matches > 0) {
                if (shareKey && championStats[shareKey] !== undefined) {
                    globalMean = championStats[shareKey] / championStats.matches;
                } else if (championStats[totalKey] !== undefined) {
                    if (key === 'cs' || key === 'vision') {
                        const totalMin = (championStats.totalDuration || 1) / 60;
                        globalMean = championStats[totalKey] / totalMin;
                    } else if (key === 'kda') {
                        const k = championStats.totalKills / championStats.matches;
                        const d = championStats.totalDeaths / championStats.matches;
                        const a = championStats.totalAssists / championStats.matches;
                        globalMean = (k + a) / Math.max(1, d);
                    }
                }
            }

            // Matchup Mean (Specific)
            let sampleMean = globalMean;
            let n = 0;
            if (matchupStats && matchupStats.matches > 0) {
                n = matchupStats.matches;
                if (shareKey && matchupStats[shareKey] !== undefined) {
                    sampleMean = matchupStats[shareKey] / n;
                } else if (matchupStats[totalKey] !== undefined) {
                    if (key === 'cs' || key === 'vision') {
                        const totalMin = (matchupStats.totalDuration || 1) / 60;
                        sampleMean = matchupStats[totalKey] / totalMin;
                    } else if (key === 'kda') {
                        const k = matchupStats.totalKills / n;
                        const d = matchupStats.totalDeaths / n;
                        const a = matchupStats.totalAssists / n;
                        sampleMean = (k + a) / Math.max(1, d);
                    }
                }
            }

            // Apply Shrinkage
            return shrinkMean(sampleMean, globalMean, n, 10);
        };

        // V4.5: Variance-Based Normalization (Standard Deviation)
        const getStdDev = (mean: number, key: string) => {
            // Try to find specific variance from DB stats if available
            // Note: We need to pass variance stats to calculateScore to use them here.
            // For now, we fallback to heuristic if not provided.
            // In V5, we should pass `championStats.totalCsd15Sq` etc.

            // Heuristic Fallback
            return Math.max(mean * 0.4, 0.1);
        };

        // 3. Calculate Z-Scores
        const zScores: Record<string, number> = {};

        // Load Weights from JSON (V5 Infrastructure)
        // In a real app, this would be loaded once at startup.
        // For now, we use the hardcoded defaults but structure it to be replaceable.
        // let weights = { ...(ROLE_WEIGHTS[role] || DEFAULT_WEIGHTS) }; // Already declared above


        // V4: Apply Class Modifiers
        if (championClass && CLASS_MODIFIERS[championClass]) {
            const mods = CLASS_MODIFIERS[championClass];
            Object.keys(mods).forEach(key => {
                if (weights[key]) weights[key] *= mods[key];
            });
        }

        // KDA
        const baselineKda = getBaselineMean('kda', 'totalKills');
        zScores.kda = (stats.kda - baselineKda) / getStdDev(baselineKda, 'kda');

        // Damage (Stomp Protection)
        const baselineDmgShare = getBaselineMean('damage', 'totalDamage', 'totalDamageShare');
        const zDmgShare = (stats.damageShare - baselineDmgShare) / getStdDev(baselineDmgShare, 'damageShare');
        const baselineDmgPerMin = (championStats?.totalDamage && championStats?.totalDuration)
            ? championStats.totalDamage / (championStats.totalDuration / 60)
            : 600;
        const zDmgPerMin = (stats.damagePerMin - baselineDmgPerMin) / getStdDev(baselineDmgPerMin, 'damagePerMin');
        zScores.damage = Math.max(zDmgShare, zDmgPerMin);

        // Gold (Stomp Protection)
        const baselineGoldShare = getBaselineMean('gold', 'totalGold', 'totalGoldShare');
        const zGoldShare = (stats.goldShare - baselineGoldShare) / getStdDev(baselineGoldShare, 'goldShare');
        const baselineGoldPerMin = (championStats?.totalGold && championStats?.totalDuration)
            ? championStats.totalGold / (championStats.totalDuration / 60)
            : 400;
        const zGoldPerMin = (stats.goldPerMin - baselineGoldPerMin) / getStdDev(baselineGoldPerMin, 'goldPerMin');
        zScores.gold = Math.max(zGoldShare, zGoldPerMin);

        const baselineCs = getBaselineMean('cs', 'totalCs');
        zScores.cs = (stats.cs - baselineCs) / getStdDev(baselineCs, 'cs');

        const baselineVision = getBaselineMean('vision', 'totalVision');
        zScores.vision = (stats.vision - baselineVision) / getStdDev(baselineVision, 'vision');

        const baselineObj = getBaselineMean('objective', 'totalObjectiveParticipation') || 2.0;
        zScores.objective = (stats.objective - baselineObj) / getStdDev(baselineObj, 'objective');

        // Utility Score
        let baselineUtil = 0;
        if (role === 'SUPPORT' || role === 'JUNGLE') baselineUtil = 10;
        else if (role === 'TOP' || role === 'MID') baselineUtil = 5;
        else baselineUtil = 2;
        zScores.utility = (stats.utility - baselineUtil) / (baselineUtil * 0.5);

        // Lane Dominance (V4.5 Normalization)
        if (laneStats) {
            // TODO: Use real StdDev from DB if available (championStats.totalCsd15Sq)
            // For now, we use improved heuristics based on Tier if possible, or fixed values.
            // Fixed values: CSD ~ 20, GD ~ 1000, XPD ~ 1000
            const zCsd = laneStats.csd15 / 20;
            const zGd = laneStats.gd15 / 1000;
            const zXpd = laneStats.xpd15 / 1000;
            zScores.lane = (zCsd + zGd + zXpd) / 3;
        } else {
            zScores.lane = 0;
        }

        // 4. Weighted Sum
        let rawScore = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(key => {
            const z = Math.max(-3, Math.min(3, zScores[key] || 0));
            rawScore += z * weights[key];
            totalWeight += weights[key];
        });

        if (laneStats) {
            const laneWeight = 0.15;
            const z = Math.max(-3, Math.min(3, zScores.lane || 0));
            rawScore += z * laneWeight;
            totalWeight += laneWeight;
        }

        if (totalWeight > 0) rawScore /= totalWeight;

        // 5. Transform to 0-100 Scale
        const percentile = getPercentile(rawScore);
        let finalScore = percentile * 100;

        // Bonus for Winning
        if (p.win) finalScore += 10.0;

        // V3: Matchup Difficulty Adjustment
        if (matchupWinRate !== undefined) {
            const difficultyMult = Math.max(0.8, Math.min(1.2, 0.5 / Math.max(0.3, matchupWinRate)));
            finalScore *= difficultyMult;
        }

        // Clamp
        finalScore = Math.max(0, Math.min(100, finalScore));

        // 6. ML Contribution
        const contribution = MLService.calculateMarginalContribution(
            { ...stats, csd15: 0, gd15: 0 },
            {
                goldShare: getBaselineMean('gold', 'totalGold', 'totalGoldShare'),
                damageShare: getBaselineMean('damage', 'totalDamage', 'totalDamageShare'),
                visionPerMin: getBaselineMean('vision', 'totalVision'),
                kda: baselineKda
            }
        );

        if (contribution > 0.10) finalScore += 5.0;

        // Clamp again
        finalScore = Math.max(0, Math.min(100, finalScore));

        // 7. Grade
        let grade = 'B';
        if (finalScore >= 95) grade = 'S+';
        else if (finalScore >= 85) grade = 'S';
        else if (finalScore >= 75) grade = 'A';
        else if (finalScore >= 60) grade = 'B';
        else if (finalScore >= 40) grade = 'C';
        else grade = 'D';

        return {
            score: Math.round(finalScore),
            grade,
            breakdown: {
                kda: Number(zScores.kda.toFixed(2)),
                damage: Number(zScores.damage.toFixed(2)),
                gold: Number(zScores.gold.toFixed(2)),
                vision: Number(zScores.vision.toFixed(2)),
                cs: Number(zScores.cs.toFixed(2)),
                objective: Number(zScores.objective.toFixed(2)),
                utility: Number(zScores.utility.toFixed(2)),
                lane: laneStats ? Number(zScores.lane.toFixed(2)) : undefined
            },
            comparison: finalScore >= 75 ? 'EXCELLENT' : finalScore >= 60 ? 'GOOD' : finalScore >= 40 ? 'AVERAGE' : 'POOR',
            contribution: Number(contribution.toFixed(3)),
            sampleSize: matchupStats?.matches || 0
        };
    }
}
