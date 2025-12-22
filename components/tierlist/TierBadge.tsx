import React from 'react';

interface TierBadgeProps {
    tier: string;
    size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {
    const getColors = (t: string) => {
        switch (t) {
            case 'S+': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
            case 'S': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
            case 'A+': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'A': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'B': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
            default: return 'bg-gray-700/20 text-gray-500 border-gray-700/50';
        }
    };

    const getSize = (s: string) => {
        switch (s) {
            case 'sm': return 'text-xs px-2 py-0.5';
            case 'lg': return 'text-xl px-4 py-2';
            default: return 'text-sm px-3 py-1';
        }
    };

    return (
        <span className={`font-display font-bold rounded border ${getColors(tier)} ${getSize(size)} backdrop-blur-sm`}>
            {tier}
        </span>
    );
};
