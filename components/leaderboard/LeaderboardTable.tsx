'use client';

import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LeaderboardRow } from './LeaderboardRow';
import { LeaderboardEntry } from '@/types';
import { Loader2 } from 'lucide-react';

interface LeaderboardTableProps {
    region: string;
    tier: string;
    mePuuid?: string;
}

const fetchLeaderboard = async ({ pageParam = undefined, queryKey }: any) => {
    const [_, region, tier] = queryKey;
    const cursorParam = pageParam ? `&cursor=${pageParam}` : '';
    const res = await fetch(`/api/leaderboard?region=${region}&tier=${tier}${cursorParam}&limit=50`);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ region, tier, mePuuid }) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['leaderboard', region, tier],
        queryFn: fetchLeaderboard,
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
        initialPageParam: undefined,
    });

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (status === 'pending') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-lol-gold" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center text-red-500 py-10">
                Error loading leaderboard. Please try again later.
            </div>
        );
    }

    return (
        <div className="w-full bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] uppercase text-gray-500 font-bold border-b border-white/5 bg-[#18181b]">
                            <th className="p-4 text-center w-16">Rank</th>
                            <th className="p-4">Summoner</th>
                            <th className="p-4">Tier</th>
                            <th className="p-4">Winrate</th>
                            <th className="p-4 text-center">Champions</th>
                            <th className="p-4 text-center">Legend Score</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-gray-300 divide-y divide-white/5">
                        {data?.pages.map((page: any, pageIndex: number) => (
                            <React.Fragment key={pageIndex}>
                                {page.players.map((player: LeaderboardEntry, index: number) => {
                                    // Calculate absolute rank: (pageIndex * 50) + index + 1
                                    const absoluteRank = (pageIndex * 50) + index + 1;
                                    return (
                                        <LeaderboardRow
                                            key={player.puuid}
                                            player={player}
                                            rank={absoluteRank}
                                            isMe={player.puuid === mePuuid}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetchingNextPage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                ) : hasNextPage ? (
                    <span className="text-xs text-gray-600">Scroll for more...</span>
                ) : (
                    <span className="text-xs text-gray-600">End of Leaderboard</span>
                )}
            </div>
        </div>
    );
};
