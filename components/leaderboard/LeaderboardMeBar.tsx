'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardEntry } from '@/types';
import { RANK_EMBLEMS } from '@/constants';
import Image from 'next/image';
import { Loader2, ChevronUp } from 'lucide-react';
import { formatRank } from '@/utils/formatUtils';

interface LeaderboardMeBarProps {
    region: string;
    puuid: string;
}

const fetchSurrounding = async ({ queryKey }: any) => {
    const [_, region, puuid] = queryKey;
    const res = await fetch(`/api/leaderboard/surrounding?region=${region}&puuid=${puuid}`);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};

export const LeaderboardMeBar: React.FC<LeaderboardMeBarProps> = ({ region, puuid }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['leaderboard', 'surrounding', region, puuid],
        queryFn: fetchSurrounding,
        enabled: !!puuid,
    });

    if (isLoading) return null;
    if (error || !data || !data.players) return null;

    const me = data.players.find((p: LeaderboardEntry) => p.puuid === puuid);
    if (!me) return null;

    // We don't know the absolute rank easily without a heavy query, 
    // but we can show the Tier/LP and maybe "Top X%" if we had it.
    // For now, let's show the Tier/LP clearly.

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-lol-gold/30 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] animate-slideUp">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4">

                <div className="flex items-center gap-6">
                    {/* Rank Icon */}
                    <div className="w-12 h-12 relative">
                        {RANK_EMBLEMS[me.tier] && (
                            <Image
                                src={RANK_EMBLEMS[me.tier]}
                                alt={me.tier}
                                fill
                                className="object-contain drop-shadow-[0_0_10px_rgba(200,170,110,0.4)]"
                            />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-lol-gold font-bold text-lg">{me.summonerName}</span>
                            <span className="text-gray-500 text-sm">#{me.tagLine}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold text-white">{formatRank(me.tier, me.rank)}</span>
                            <span className="text-gray-400">{me.lp} LP</span>
                            <span className={`font-bold ${me.winrate >= 50 ? 'text-lol-win' : 'text-lol-loss'}`}>
                                {Math.round(me.winrate)}% WR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={() => {
                        // In a real implementation, we would scroll to the row if loaded, 
                        // or reload the table centered on this user.
                        // For now, let's just scroll to top as a placeholder or maybe reload page with ?focus=me
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-2 bg-lol-gold/10 hover:bg-lol-gold/20 border border-lol-gold/30 rounded-full text-lol-gold font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2 group"
                >
                    <span>Jump to Top</span>
                    <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                </button>

            </div>
        </div>
    );
};
