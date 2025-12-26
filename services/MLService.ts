
export class MLService {

    // Pre-trained weights (Heuristic/Estimated for now)
    // Features: [GoldShare, DamageShare, VisionPerMin, KDA, CSD@15, GD@15]
    // Bias: -0.5 (Base winrate 50% -> LogOdds 0. But let's assume average stats -> 50%)
    private static readonly WEIGHTS = {
        goldShare: 2.5,      // High impact
        damageShare: 2.0,    // High impact
        visionPerMin: 0.5,   // Moderate
        kda: 0.8,            // Moderate (log scale or capped?)
        csd15: 0.02,         // Per CS
        gd15: 0.0005,        // Per Gold
        bias: -2.0           // Adjust to center around 0.5 for average stats
    };

    /**
     * Predicts the probability of winning based on player stats.
     * This is a simplified Logistic Regression model.
     * @param stats Player statistics
     */
    static predictWinProbability(stats: {
        goldShare: number;
        damageShare: number;
        visionPerMin: number;
        kda: number;
        csd15: number;
        gd15: number;
    }): number {
        const w = MLService.WEIGHTS;

        // Linear Combination
        const logOdds =
            w.bias +
            (stats.goldShare * w.goldShare) +
            (stats.damageShare * w.damageShare) +
            (stats.visionPerMin * w.visionPerMin) +
            (Math.min(10, stats.kda) * w.kda) + // Cap KDA to avoid skew
            (stats.csd15 * w.csd15) +
            (stats.gd15 * w.gd15);

        // Sigmoid
        return 1 / (1 + Math.exp(-logOdds));
    }

    /**
     * Calculates the Marginal Contribution of a player compared to a baseline.
     * Result is the difference in Win Probability (e.g., +0.05 = +5% win chance).
     */
    static calculateMarginalContribution(
        playerStats: any,
        baselineStats: any
    ): number {
        const pProb = MLService.predictWinProbability({
            goldShare: playerStats.goldShare || 0.2,
            damageShare: playerStats.damageShare || 0.2,
            visionPerMin: playerStats.visionPerMin || 1.0,
            kda: playerStats.kda || 3.0,
            csd15: playerStats.csd15 || 0,
            gd15: playerStats.gd15 || 0
        });

        const bProb = MLService.predictWinProbability({
            goldShare: baselineStats.goldShare || 0.2,
            damageShare: baselineStats.damageShare || 0.2,
            visionPerMin: baselineStats.visionPerMin || 1.0,
            kda: baselineStats.kda || 3.0,
            csd15: 0, // Baseline usually 0 diff
            gd15: 0
        });

        return pProb - bProb;
    }
}
