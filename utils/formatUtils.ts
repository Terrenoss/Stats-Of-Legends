import { RANK_EMBLEMS } from '../constants';

export const getRankColor = (tier: string | null | undefined): string => {
    switch (tier?.toUpperCase()) {
        case 'IRON': return '#a19d94';
        case 'BRONZE': return '#cd7f32';
        case 'SILVER': return '#c0c0c0';
        case 'GOLD': return '#ffd700';
        case 'PLATINUM': return '#4ecdc4'; // Teal/Cyan
        case 'EMERALD': return '#2ecc71';
        case 'DIAMOND': return '#b9f2ff'; // Diamond Blue
        case 'MASTER': return '#9b59b6'; // Purple
        case 'GRANDMASTER': return '#e74c3c'; // Red
        case 'CHALLENGER': return '#f1c40f'; // Gold/Blue mix
        default: return '#ffd700'; // Default Gold-ish
    }
};

export const formatRank = (tier: string | null | undefined, rank: string | null | undefined): string => {
    if (!tier || tier === 'UNRANKED' || tier === 'Unranked') return 'UNRANKED';
    const t = tier.toUpperCase();
    if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(t)) {
        return t;
    }
    return `${t} ${rank || ''}`;
};

export const getGradeColor = (grade?: string): string => {
    if (!grade) return 'text-gray-400';
    if (grade === 'S+' || grade === 'S') return 'text-yellow-400';
    if (grade === 'A') return 'text-emerald-400';
    if (grade === 'B') return 'text-blue-400';
    return 'text-gray-400';
};

export const getRankIconUrl = (tier: string | null | undefined): string => {
    if (!tier || tier === 'UNRANKED' || tier === 'Unranked') return RANK_EMBLEMS['UNRANKED'];
    const t = tier.toUpperCase();
    return RANK_EMBLEMS[t] || RANK_EMBLEMS['UNRANKED'];
};

export const getKdaColorClass = (kda: number | string): string => {
    const kdaNum = Number(kda);
    if (kdaNum >= 5) return 'text-orange-500 animate-burn font-black';
    if (kdaNum >= 4) return 'text-lol-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]';
    if (kdaNum >= 3) return 'text-blue-400';
    return 'text-gray-400';
};
