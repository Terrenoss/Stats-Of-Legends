import React from 'react';
import { ChampionTier } from '../../types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getChampionIconUrl } from '../../utils/ddragon';
import { TierBadge } from './TierBadge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChampionTierRowProps {
    champion: ChampionTier;
    rank: number;
}

export const ChampionTierRow: React.FC<ChampionTierRowProps> = ({ champion, rank }) => {
    const searchParams = useSearchParams();
    const currentRank = searchParams.get('rank') || 'CHALLENGER';

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
            <td className="py-4 pl-6 text-gray-400 font-mono text-sm">#{rank}</td>
            <td className="py-4">
                <Link
                    href={`/champions/${champion.id}?role=${champion.role}&rank=${currentRank}`}
                    className="flex items-center gap-4 group"
                >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-lol-gold transition-colors relative">
                        <img
                            src={getChampionIconUrl(champion.id)}
                            alt={champion.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <span className="font-bold text-gray-200 group-hover:text-lol-gold transition-colors">{champion.name}</span>
                </Link>
            </td>
            <td className="py-4 text-gray-400 font-mono text-sm">
                {champion.role}
            </td>
            <td className="py-4 text-center">
                <div className="flex justify-center">
                    <TierBadge tier={champion.tier} />
                </div>
            </td>
            <td className="py-4 text-center font-mono text-gray-300">
                <span className={champion.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                    {champion.winRate}%
                </span>
            </td>
            <td className="py-4 text-center font-mono text-gray-400">{champion.pickRate}%</td>
            <td className="py-4 text-center font-mono text-gray-400">{champion.banRate}%</td>
            <td className="py-4">
                <div className="flex gap-1">
                    {champion.counters?.map((counterId, i) => (
                        <div key={i} className="relative w-8 h-8 rounded-full border border-black/50" title={counterId}>
                            <img
                                src={getChampionIconUrl(counterId)}
                                alt={counterId}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    {(!champion.counters || champion.counters.length === 0) && <span className="text-xs text-gray-600 pl-2">-</span>}
                </div>
            </td>
            <td className="py-4 text-center font-mono text-gray-400">{champion.matches}</td>
            <td className="py-4 pr-6">
                <div className="flex justify-center items-center gap-2">
                    {getTrendIcon(champion.trend)}
                </div>
            </td>
        </tr>
    );
};
