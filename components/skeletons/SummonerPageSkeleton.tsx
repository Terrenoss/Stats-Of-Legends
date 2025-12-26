import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { MatchSkeleton } from './MatchSkeleton';

export const SummonerPageSkeleton = () => {
    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Skeleton className="lg:col-span-4 h-64 rounded-[2rem]" />
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <Skeleton className="h-32 rounded-[1.5rem]" />
                    <Skeleton className="h-28 rounded-[1.5rem]" />
                </div>
                <Skeleton className="lg:col-span-4 h-64 rounded-[1.5rem]" />
            </div>
            <div className="flex gap-6">
                <Skeleton className="w-32 h-10" />
                <Skeleton className="w-32 h-10" />
                <Skeleton className="w-32 h-10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="h-72 rounded-[2rem]" />
                    <Skeleton className="h-64 rounded-[2rem]" />
                </div>
                <div className="lg:col-span-8 space-y-4">
                    <MatchSkeleton />
                    <MatchSkeleton />
                    <MatchSkeleton />
                </div>
            </div>
        </div>
    );
};
