export const assignRoles = (participants: any[]) => {
    const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    const assignments: Record<string, any> = {
        TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null
    };

    const unassigned = [...participants];

    // Helper to calculate score for a player in a role
    const getScore = (p: any, role: string) => {
        let score = 0;
        // Main Role Match
        if (p.inferredRole === role) score += 10;

        // Smite -> Jungle (Strong Bonus)
        const hasSmite = p.spell1Id === 11 || p.spell2Id === 11;
        if (role === 'JUNGLE' && hasSmite) score += 50;

        // Penalty for assigning Smite to Non-Jungle (unless forced)
        if (role !== 'JUNGLE' && hasSmite) score -= 20;

        return score;
    };

    // Greedy Assignment: Find best player for each role
    const PRIORITY_ORDER = ['JUNGLE', 'SUPPORT', 'ADC', 'MID', 'TOP'];

    for (const role of PRIORITY_ORDER) {
        let bestPlayerIndex = -1;
        let bestScore = -100;

        unassigned.forEach((p, i) => {
            const score = getScore(p, role);
            if (score > bestScore) {
                bestScore = score;
                bestPlayerIndex = i;
            }
        });

        if (bestPlayerIndex !== -1 && bestScore > 0) {
            assignments[role] = unassigned[bestPlayerIndex];
            unassigned.splice(bestPlayerIndex, 1);
        }
    }

    // Fill remaining slots with remaining players (Top to Bottom)
    ROLES.forEach(role => {
        if (!assignments[role] && unassigned.length > 0) {
            assignments[role] = unassigned.shift();
        }
    });

    return assignments;
};

export const SPELL_MAP: Record<number, string> = {
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
