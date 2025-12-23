export const getAverageRank = (ranks: (string | null | undefined)[]) => {
    if (!ranks || ranks.length === 0) return 'Unranked';

    const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const divs = { 'IV': 0, 'III': 1, 'II': 2, 'I': 3 };

    let totalScore = 0;
    let count = 0;

    for (const r of ranks) {
        if (!r) continue;
        const parts = r.split(' ');
        const tier = parts[0].toUpperCase();
        const rank = parts[1] as keyof typeof divs;

        const tierIdx = tiers.indexOf(tier);
        if (tierIdx === -1) continue;

        let score = tierIdx * 4;
        if (rank && divs[rank] !== undefined) {
            score += divs[rank];
        }

        // High elo handling (Master+)
        if (tierIdx >= 7) {
            score = tierIdx * 4;
        }

        totalScore += score;
        count++;
    }

    if (count === 0) return 'Unranked';

    const avgScore = Math.round(totalScore / count);
    const avgTierIdx = Math.floor(avgScore / 4);
    const avgDivScore = avgScore % 4;

    const avgTier = tiers[avgTierIdx] || 'CHALLENGER';
    const avgDiv = Object.keys(divs).find(key => divs[key as keyof typeof divs] === avgDivScore) || 'I';

    if (avgTierIdx >= 7) return avgTier.charAt(0) + avgTier.slice(1).toLowerCase();

    return `${avgTier.charAt(0) + avgTier.slice(1).toLowerCase()} ${avgDiv}`;
};
