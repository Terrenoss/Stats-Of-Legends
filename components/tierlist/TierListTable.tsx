import React from 'react';
import { ChampionTier } from '../../types';
import { ChampionTierRow } from './ChampionTierRow';
import { ArrowUpDown } from 'lucide-react';

interface TierListTableProps {
    data: ChampionTier[];
    sortConfig: { key: keyof ChampionTier; direction: 'asc' | 'desc' } | null;
    onSort: (key: keyof ChampionTier) => void;
}

export const TierListTable: React.FC<TierListTableProps> = ({ data, sortConfig, onSort }) => {
    const headers: { key: keyof ChampionTier; label: string; sortable: boolean }[] = [
        { key: 'rank', label: 'Rank', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'name', label: 'Champion', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true },
        { key: 'winRate', label: 'Win Rate', sortable: true },
        { key: 'pickRate', label: 'Pick Rate', sortable: true },
        { key: 'banRate', label: 'Ban Rate', sortable: true },
        { key: 'counters', label: 'Counter Picks', sortable: false },
        { key: 'matches', label: 'Matches', sortable: true },
        { key: 'trend', label: 'Trend', sortable: false },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                        {headers.map((header) => (
                            <th
                                key={header.key}
                                className={`py-4 px-4 ${header.key === 'rank' ? 'pl-6' : ''} ${header.key === 'trend' ? 'pr-6' : ''} ${header.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                                onClick={() => header.sortable && onSort(header.key)}
                            >
                                <div className={`flex items-center gap-2 ${['winRate', 'pickRate', 'banRate', 'tier', 'trend', 'matches'].includes(header.key) ? 'justify-center' : ''}`}>
                                    {header.label}
                                    {header.sortable && (
                                        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === header.key ? 'text-lol-gold opacity-100' : 'opacity-30'}`} />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((champion, index) => (
                        <ChampionTierRow key={`${champion.id}-${champion.role}`} champion={champion} rank={index + 1} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
