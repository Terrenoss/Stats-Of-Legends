
import React from 'react';

export const MatchSkeleton: React.FC = () => {
  return (
    <div className="mb-4 rounded-[1.5rem] bg-[#121212] border border-white/5 p-4 flex flex-col md:flex-row gap-6 items-center animate-pulse">
        <div className="w-full md:w-28 flex flex-col gap-2">
            <div className="h-3 w-16 bg-white/10 rounded"></div>
            <div className="h-6 w-20 bg-white/10 rounded"></div>
            <div className="h-3 w-12 bg-white/10 rounded"></div>
        </div>
        <div className="flex gap-3 items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10"></div>
            <div className="flex flex-col gap-1">
                <div className="w-6 h-6 rounded-md bg-white/10"></div>
                <div className="w-6 h-6 rounded-md bg-white/10"></div>
            </div>
        </div>
        <div className="flex flex-col items-center w-32 gap-2">
            <div className="h-6 w-24 bg-white/10 rounded"></div>
            <div className="h-3 w-16 bg-white/10 rounded"></div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[160px]">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="w-8 h-8 rounded-lg bg-white/5"></div>
            ))}
        </div>
        <div className="flex-grow flex justify-end">
            <div className="w-8 h-8 rounded-full bg-white/5"></div>
        </div>
    </div>
  );
};
