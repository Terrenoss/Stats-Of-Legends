export const TIER_ORDER = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];

export function getTargetTiers(rank: string): string[] {
    if (rank === 'GOLD_PLUS') {
        return TIER_ORDER.slice(0, TIER_ORDER.indexOf('GOLD') + 1);
    } else if (rank === 'GOLD_MINUS') {
        return TIER_ORDER.slice(TIER_ORDER.indexOf('GOLD'));
    } else if (rank === 'PLATINUM_PLUS') {
        return TIER_ORDER.slice(0, TIER_ORDER.indexOf('PLATINUM') + 1);
    } else if (rank === 'EMERALD_PLUS') {
        return TIER_ORDER.slice(0, TIER_ORDER.indexOf('EMERALD') + 1);
    } else if (rank === 'DIAMOND_PLUS') {
        return TIER_ORDER.slice(0, TIER_ORDER.indexOf('DIAMOND') + 1);
    } else if (rank === 'ALL') {
        return TIER_ORDER;
    }
    return [rank];
}
