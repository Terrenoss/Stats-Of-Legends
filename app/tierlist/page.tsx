'use client';

import React, { Suspense } from 'react';
import { TierListService } from '@/services/TierListService';
import { ChampionTier } from '@/types';
import { TierListTable } from '@/components/tierlist/TierListTable';
import { Search, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTierListData } from '@/hooks/useTierListData';

interface TierListHeaderProps {
    filters: {
        rank: string;
        search: string;
    };
    actions: {
        setRank: (v: string) => void;
        setSearch: (v: string) => void;
    };
    options: {
        tiers: string[];
        formatTier: (t: string) => string;
    };
}

const TierListHeader = ({ filters, actions, options }: TierListHeaderProps) => (
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
                    value={filters.rank}
                    onChange={(e) => actions.setRank(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-lol-gold/50 transition-colors text-white"
                >
                    {options.tiers.map((t: string) => <option key={t} value={t} className="bg-[#121212]">{options.formatTier(t)}</option>)}
                </select>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search champion..."
                    value={filters.search}
                    onChange={(e) => actions.setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-lol-gold/50 transition-colors"
                />
            </div>
        </div>
    </div>
);

const TierListFilters = ({ selectedRole, setSelectedRole, ROLES }: any) => (
    <div className="flex gap-2 overflow-x-auto pb-2">
        {ROLES.map((role: any) => (
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
);

function TierListContent() {
    const {
        selectedRole, setSelectedRole,
        selectedRank, setSelectedRank,
        searchQuery, setSearchQuery,
        sortedData,
        loading,
        sortConfig,
        handleSort
    } = useTierListData();

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

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 pb-32" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto space-y-8" suppressHydrationWarning>
                <TierListHeader
                    filters={{
                        rank: selectedRank,
                        search: searchQuery
                    }}
                    actions={{
                        setRank: setSelectedRank,
                        setSearch: setSearchQuery
                    }}
                    options={{
                        tiers: TIERS,
                        formatTier: formatTier
                    }}
                />
                <TierListFilters
                    selectedRole={selectedRole}
                    setSelectedRole={setSelectedRole}
                    ROLES={ROLES}
                />

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
