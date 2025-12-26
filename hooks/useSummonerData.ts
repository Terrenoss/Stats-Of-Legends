import { useState, useEffect } from 'react';
import { SummonerProfile, Match, HeatmapDay, DetailedChampionStats, Teammate } from '@/types';

export function useSummonerData(region: string, summonerName: string) {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [profile, setProfile] = useState<SummonerProfile | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [champions, setChampions] = useState<DetailedChampionStats[]>([]);
    const [teammates, setTeammates] = useState<Teammate[]>([]);
    const [performance, setPerformance] = useState<any>(null);
    const [lpHistory, setLpHistory] = useState<any[]>([]);
    const [version, setVersion] = useState<string>('15.24.1');

    const loadData = async (isUpdate = false) => {
        if (isUpdate) setUpdating(true);
        else setLoading(true);

        setUpdateError(null);
        const nameParam = decodeURIComponent(summonerName);
        let name = nameParam;
        let tag = region;

        if (nameParam.includes('-')) {
            [name, tag] = nameParam.split('-');
        }

        try {
            const url = new URL(`/api/summoner`, window.location.origin);
            url.searchParams.append('region', region);
            url.searchParams.append('name', name);
            url.searchParams.append('tag', tag);
            if (isUpdate) {
                url.searchParams.append('force', 'true');
            }

            const res = await fetch(url.toString());

            if (res.ok) {
                const realData = await res.json();

                setProfile(realData.profile as SummonerProfile);
                setMatches(realData.matches as Match[]);
                setHeatmap(realData.heatmap as HeatmapDay[]);
                setChampions(realData.champions as DetailedChampionStats[]);
                setTeammates(realData.teammates as Teammate[]);
                setLpHistory(realData.lpHistory || []);
                setPerformance(realData.performance || null);
                if (realData.version) setVersion(realData.version);
            } else {
                const errJson = await res.json().catch(() => null);
                if (errJson?.error === 'RIOT_FORBIDDEN') {
                    setUpdateError('Impossible de mettre à jour les données : accès Riot API refusé (403).');
                } else {
                    setUpdateError('Échec de la mise à jour des données du joueur.');
                }
                throw new Error('Fetch summoner failed');
            }

        } catch (e) {
            console.error('Failed to fetch summoner', e);
            if (!isUpdate) {
                setProfile(null);
                setMatches([]);
                setHeatmap([]);
                setChampions([]);
                setTeammates([]);
            }
        } finally {
            setLoading(false);
            setUpdating(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region, summonerName]);

    const updateData = () => loadData(true);

    return {
        loading,
        updating,
        updateError,
        profile,
        matches,
        heatmap,
        champions,
        teammates,
        performance,
        lpHistory,
        version,
        updateData
    };
}
