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

    const loadData = async (isUpdate = false, isPolling = false) => {
        if (isUpdate) setUpdating(true);
        else if (!isPolling) setLoading(true);

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
                setPerformance(realData.performance || null);
                if (realData.version) setVersion(realData.version);

                return (realData.matches as Match[]).length;
            } else {
                const errJson = await res.json().catch(() => null);
                if (errJson?.error === 'RIOT_FORBIDDEN') {
                    setUpdateError('Impossible de mettre à jour les données : accès Riot API refusé (403).');
                } else {
                    setUpdateError('Échec de la mise à jour des données du joueur.');
                }
                throw new Error('Fetch summoner failed');
            }
            return 0;

        } catch (e) {
            console.error('Failed to fetch summoner', e);
            if (!isUpdate && !isPolling) {
                setProfile(null);
                setMatches([]);
                setHeatmap([]);
                setChampions([]);
                setTeammates([]);
            }
            return 0;
        } finally {
            setLoading(false);
            if (!isPolling) setUpdating(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [region, summonerName]);

    const updateData = async () => {
        setUpdating(true);
        // 1. Trigger Update (Backend returns immediately)
        // We pass isPolling=true to PREVENT loadData from setting updating=false in finally block
        let lastMatchCount = await loadData(true, true) || 0;

        // 2. Poll for updates with Stability Check
        let attempts = 0;
        let stabilityCount = 0; // Number of polls with no change
        const maxAttempts = 30; // Hard limit ~60s
        const stabilityThreshold = 5; // Stop after 5 polls (10s) with no new data

        const interval = setInterval(async () => {
            attempts++;
            // Pass isPolling=true to avoid full loading state
            const currentCount = await loadData(false, true) || 0;

            if (currentCount > lastMatchCount) {
                // New data arrived! Reset stability count
                stabilityCount = 0;
                lastMatchCount = currentCount;
            } else {
                // No change
                stabilityCount++;
            }

            // Stop conditions
            if (stabilityCount >= stabilityThreshold || attempts >= maxAttempts) {
                clearInterval(interval);
                setUpdating(false);
            }
        }, 2000);
    };

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
