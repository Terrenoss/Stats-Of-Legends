import { ChampionTier } from '../types';

export const TierListService = {
    getTierList: async (role?: string, rank?: string): Promise<ChampionTier[]> => {
        const res = await fetch(`/api/tierlist?role=${role || 'ALL'}&rank=${rank || 'CHALLENGER'}`);
        if (!res.ok) throw new Error("Failed to fetch tier list");
        const data: ChampionTier[] = await res.json();

        // Client-side sorting/ranking
        const tierOrder: Record<string, number> = { 'S+': 6, 'S': 5, 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
        data.sort((a, b) => {
            const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
            if (tierDiff !== 0) return tierDiff;
            return b.winRate - a.winRate;
        });

        // Assign ranks
        return data.map((c, i) => ({ ...c, rank: i + 1 }));
    }
};
