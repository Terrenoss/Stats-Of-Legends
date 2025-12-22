export const ChampionService = {
    getChampionDetails: async (name: string, role: string = 'MID', rank: string = 'CHALLENGER') => {
        const res = await fetch(`/api/champions/${name}?role=${role}&rank=${rank}`);
        if (!res.ok) throw new Error('Failed to fetch champion details');
        return res.json();
    }
};
