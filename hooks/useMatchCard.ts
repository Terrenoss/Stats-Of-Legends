import { useState } from 'react';
import { Match } from '../types';

export const useMatchCard = (match: Match, region: string) => {
    const [activeTab, setActiveTab] = useState<'NONE' | 'SUMMARY' | 'SCORE' | 'TEAM' | 'BUILD' | 'OTHER'>('NONE');
    const [ranks, setRanks] = useState<Record<string, any>>({});
    const [ranksLoaded, setRanksLoaded] = useState(false);

    const fetchRanks = async () => {
        if (ranksLoaded) return;
        try {
            const puuids = match.participants.map((p) => p.puuid).filter(Boolean);
            const res = await fetch('/api/match/ranks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region, puuids, matchId: match.id })
            });
            if (res.ok) {
                const matchData = await res.json();
                setRanks(matchData);
                setRanksLoaded(true);
            }
        } catch (e) {
            console.error('Failed to fetch ranks', e);
        }
    };

    const toggleTab = (tab: typeof activeTab) => {
        if (activeTab === tab) {
            setActiveTab('NONE');
        } else {
            setActiveTab(tab);
            // Fetch ranks if expanding for the first time
            if (!ranksLoaded) {
                fetchRanks();
            }
        }
    };

    return {
        activeTab,
        setActiveTab,
        ranks,
        ranksLoaded,
        fetchRanks,
        toggleTab
    };
};
