import { RANK_EMBLEMS } from '../constants';
import { Match, GameMode } from '../types';

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


export const getQueueLabel = (match: Match, t: any): string => {
    if (match.queueId === 420) return t.rankSolo;
    if (match.queueId === 440) return t.rankFlex;
    if (match.queueId === 450) return 'ARAM';
    if (match.queueId === 400 || match.queueId === 430) return t.normal;

    const mode = match.gameMode as string;
    if (mode === GameMode.SOLO_DUO || mode === 'RANKED_SOLO_5x5') return t.rankSolo;
    if (mode === GameMode.FLEX || mode === 'RANKED_FLEX_SR') return 'Ranked Flex';
    if (mode === GameMode.ARAM || mode === 'ARAM') return 'ARAM';
    if (mode === GameMode.NORMAL || mode === 'NORMAL_5x5') return t.normal;
    return String(mode || t.normal);
};

export const getTimeAgo = (gameCreation: number | undefined): string => {
    const ts = typeof gameCreation === 'number' ? gameCreation : 0;
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};
