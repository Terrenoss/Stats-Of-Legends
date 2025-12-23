'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { TierListService } from '@/services/TierListService';
import { ChampionTier } from '@/types';
import { TierListTable } from '@/components/tierlist/TierListTable';
import { Search, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function TierListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state with defaults to prevent hydration mismatch
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [selectedRank, setSelectedRank] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const role = searchParams.get('role');
        const rank = searchParams.get('rank');
        if (role) setSelectedRole(role);
        if (rank) setSelectedRank(rank);
    }, [searchParams]);

    const [data, setData] = useState<ChampionTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ChampionTier; direction: 'asc' | 'desc' } | null>({ key: 'tier', direction: 'desc' });

    const ROLES = [
        { id: 'ALL', label: 'All Roles' },
        { id: 'TOP', label: 'Top' },
        { id: 'JUNGLE', label: 'Jungle' },
        { id: 'MID', label: 'Mid' },
        { id: 'ADC', label: 'Bot' },
        { id: 'SUPPORT', label: 'Support' },
    ];

    // Logical ordering for the dropdown
    const TIERS = [
        'ALL',
        'CHALLENGER', 'GRANDMASTER', 'MASTER',
        'DIAMOND_PLUS', 'DIAMOND',
        'EMERALD_PLUS', 'EMERALD',
        'PLATINUM_PLUS', 'PLATINUM',
        'GOLD_PLUS', 'GOLD', 'GOLD_MINUS',
        'SILVER', 'BRONZE', 'IRON'
    ];

    const formatTier = (t: string) => {
        if (t === 'ALL') return 'All Ranks';
        if (t.endsWith('_PLUS')) return `${t.replace('_PLUS', '')} +`;
        if (t.endsWith('_MINUS')) return `${t.replace('_MINUS', '')} -`;
        return t;
    };

    // Update URL when filters change
    useEffect(() => {
        if (!isMounted) return;

        const params = new URLSearchParams();
        if (selectedRole !== 'ALL') params.set('role', selectedRole);
        if (selectedRank !== 'CHALLENGER' && selectedRank !== 'ALL') params.set('rank', selectedRank);

        // Replace URL without reloading
        router.replace(`?${params.toString()}`, { scroll: false });

        loadData();
    }, [selectedRole, selectedRank, isMounted]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await TierListService.getTierList(selectedRole, selectedRank);
            setData(result);
        } catch (error) {
            console.error("Failed to load tier list", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof ChampionTier) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        let sortableItems = [...data];

        // Filter by search
        if (searchQuery) {
            sortableItems = sortableItems.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Custom sort for Tier
                if (sortConfig.key === 'tier') {
                    const tierOrder: Record<string, number> = { 'S+': 6, 'S': 5, 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
                    const diff = tierOrder[b.tier] - tierOrder[a.tier];
                    return sortConfig.direction === 'asc' ? -diff : diff;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 pb-32" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto space-y-8" suppressHydrationWarning>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8" suppressHydrationWarning>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-yellow-600 mb-2">
                            Meta Tier List
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl">
                            The best champions in the current patch, analyzed by win rate, pick rate, and ban rate.
                        </p>
                    </div>

                    <div className="flex gap-4 items-end">
                        {/* Rank Filter */}
                        <div className="w-40">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Rank</label>
                            <select
                                value={selectedRank}
                                onChange={(e) => setSelectedRank(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lol-gold/50 transition-colors text-white"
                            >
                                {TIERS.map(t => <option key={t} value={t} className="bg-[#121212]">{formatTier(t)}</option>)}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search champion..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-lol-gold/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedRole === role.id
                                ? 'bg-lol-gold text-black shadow-[0_0_15px_rgba(200,155,60,0.4)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                            <div className="w-12 h-12 border-4 border-lol-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <TierListTable
                            data={sortedData}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TierListPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">Loading...</div>}>
            <TierListContent />
        </Suspense>
    );
}
