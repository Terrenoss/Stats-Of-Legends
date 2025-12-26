export const ROLES = [
    { id: 'TOP', label: 'Top' },
    { id: 'JUNGLE', label: 'Jungle' },
    { id: 'MID', label: 'Mid' },
    { id: 'ADC', label: 'ADC' },
    { id: 'SUPPORT', label: 'Support' },
];

export const TIERS = [
    'CHALLENGER', 'GRANDMASTER', 'MASTER',
    'DIAMOND_PLUS', 'EMERALD_PLUS', 'PLATINUM_PLUS', 'GOLD_PLUS',
    'ALL'
];

export const formatTier = (t: string) => {
    if (t === 'ALL') return 'All Ranks';
    if (t.endsWith('_PLUS')) return `${t.replace('_PLUS', '')} +`;
    return t;
};

export const getSpellName = (id: string) => {
    const map: Record<string, string> = {
        '4': 'SummonerFlash',
        '14': 'SummonerDot', // Ignite
        '12': 'SummonerTeleport',
        '6': 'SummonerHaste', // Ghost
        '7': 'SummonerHeal',
        '11': 'SummonerSmite',
        '3': 'SummonerExhaust',
        '21': 'SummonerBarrier',
        '1': 'SummonerBoost', // Cleanse
    };
    return map[id] || 'SummonerFlash';
};

export const getRoleIcon = (role: string) => {
    const map: Record<string, string> = {
        'TOP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-top.png',
        'JUNGLE': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-jungle.png',
        'MID': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-middle.png',
        'ADC': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-bottom.png',
        'SUPPORT': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-utility.png',
    };
    return map[role] || '';
};

export const getTopItems = (items: Record<string, any>, count: number = 6) => {
    return Object.entries(items)
        .sort(([, a], [, b]) => b.matches - a.matches)
        .slice(0, count)
        .map(([id, s]) => ({ id, ...s, wr: ((s.wins / s.matches) * 100).toFixed(1) }));
};
