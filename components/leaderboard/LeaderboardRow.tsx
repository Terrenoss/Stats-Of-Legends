import React from 'react';
import Image from 'next/image';
import { LeaderboardEntry } from '@/types';
import { RANK_EMBLEMS } from '@/constants';
import { getProfileIconUrl, getChampionIconUrl } from '@/utils/ddragon';
import { formatRank } from '@/utils/formatUtils';
import { Trophy } from 'lucide-react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

interface LeaderboardRowProps {
    player: LeaderboardEntry;
    rank: number;
    isMe?: boolean;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ player, rank, isMe }) => {
    const router = useRouter();
    const isTop3 = rank <= 3;
    const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#6b7280';
    const glowColor = rank === 1 ? 'rgba(255, 215, 0, 0.2)' : rank === 2 ? 'rgba(192, 192, 192, 0.2)' : rank === 3 ? 'rgba(205, 127, 50, 0.2)' : 'transparent';

    const REGION_DISPLAY_MAP: Record<string, string> = {
        'EUW1': 'EUW',
        'NA1': 'NA',
        'KR': 'KR',
        'EUN1': 'EUNE',
        'BR1': 'BR',
        'LA1': 'LAN',
        'OC1': 'OCE',
        'TR1': 'TR',
        'RU': 'RU',
        'JP1': 'JP',
    };

    const displayRegion = REGION_DISPLAY_MAP[player.region] || player.region;

    const handleRowClick = () => {
        router.push(`/summoner/${displayRegion}/${player.summonerName}-${player.tagLine}`);
    };

    return (
        <tr
            onClick={handleRowClick}
            className={`group transition-all duration-300 hover:bg-white/5 cursor-pointer relative ${isMe ? 'bg-lol-gold/10' : ''}`}
            style={{ boxShadow: isTop3 ? `inset 0 0 20px ${glowColor}` : 'none' }}
        >
            {/* Rank */}
            <td className="p-4 text-center font-mono font-bold text-lg relative">
                {isTop3 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <Trophy className="w-8 h-8" style={{ color: rankColor }} />
                    </div>
                )}
                <span style={{ color: isTop3 ? rankColor : '#9ca3af' }}>{rank}</span>
            </td>

            {/* Summoner */}
            <td className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10">
                        <Image
                            src={getProfileIconUrl(player.profileIconId)}
                            alt={player.summonerName}
                            fill
                            className={`rounded-full object-cover border-2 ${isTop3 ? 'border-opacity-100' : 'border-opacity-0 group-hover:border-opacity-50'} transition-all`}
                            style={{ borderColor: isTop3 ? rankColor : '#C8AA6E' }}
                        />
                        {isMe && (
                            <div className="absolute -bottom-1 -right-1 bg-lol-gold text-black text-[8px] font-bold px-1 rounded-full">
                                ME
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href={`/summoner/${displayRegion}/${player.summonerName}-${player.tagLine}`}
                            className={`font-bold text-sm ${isTop3 ? 'text-white' : 'text-gray-200'} group-hover:text-lol-gold transition-colors hover:underline`}
                            onClick={(e) => e.stopPropagation()} // Prevent double navigation
                        >
                            {player.summonerName}
                        </Link>
                        <span className="text-xs text-gray-500">#{player.tagLine}</span>
                    </div>
                </div>
            </td>

            {/* Tier */}
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 relative">
                        {RANK_EMBLEMS[player.tier] && (
                            <Image
                                src={RANK_EMBLEMS[player.tier]}
                                alt={player.tier}
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-300">{formatRank(player.tier, player.rank)}</span>
                        <span className="text-[10px] text-gray-500">{player.lp} LP</span>
                    </div>
                </div>
            </td>

            {/* Winrate */}
            <td className="p-4">
                <div className="flex flex-col gap-1 w-32">
                    <div className="flex justify-between text-xs font-bold">
                        <span className={player.winrate >= 50 ? 'text-lol-win' : 'text-lol-loss'}>
                            {Math.round(player.winrate)}%
                        </span>
                        <span className="text-gray-500 text-[10px]">{player.wins + player.losses} Games</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden flex">
                        <div
                            style={{ width: `${player.winrate}%` }}
                            className={`h-full ${player.winrate >= 50 ? 'bg-lol-win' : 'bg-lol-loss'}`}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-500">
                        <span>{player.wins}W</span>
                        <span>{player.losses}L</span>
                    </div>
                </div>
            </td>

            {/* Top Champions */}
            <td className="p-4">
                <div className="flex items-center justify-center gap-1">
                    {player.topChampions?.map((champ, i) => (
                        <div key={i} className="relative group/champ">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative">
                                <Image
                                    src={getChampionIconUrl(champ.championName)}
                                    alt={champ.championName}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/champ:block bg-black/90 text-white text-[10px] p-1 rounded whitespace-nowrap z-10 border border-white/10">
                                <div className="font-bold">{champ.championName}</div>
                                <div className="text-gray-400">{champ.count} games</div>
                                <div className={champ.winrate >= 50 ? 'text-lol-win' : 'text-lol-loss'}>
                                    {Math.round(champ.winrate)}% WR
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!player.topChampions || player.topChampions.length === 0) && (
                        <span className="text-xs text-gray-600">-</span>
                    )}
                </div>
            </td>

            {/* Legend Score */}
            <td className="p-4 text-center">
                <div className="text-xs font-bold text-lol-gold">{player.legendScore > 0 ? player.legendScore.toFixed(1) : '-'}</div>
            </td>
        </tr>
    );
};
