import React from 'react';
import { Metadata } from 'next';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { LeaderboardMeBar } from '@/components/leaderboard/LeaderboardMeBar';
import { Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard - Stats Of Legends',
  description: 'Top League of Legends players in EUW. View rankings, winrates, and stats.',
};

export default function LeaderboardPage() {
  // In a real app, these would come from searchParams or a context
  const region = 'EUW1';
  const tier = 'ALL';
  const mePuuid = ''; // This would come from auth context or local storage

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* Header */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-lol-gold/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-lol-gold/10 flex items-center justify-center border border-lol-gold/30 shadow-[0_0_30px_rgba(200,170,110,0.2)]">
              <Trophy className="w-8 h-8 text-lol-gold" />
            </div>
          </div>
          <h1 className="text-5xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-lol-gold to-[#8a733e] mb-4 drop-shadow-lg">
            Leaderboard
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">
            The best players in <span className="text-white font-bold">EUW</span>. Rise to the top and become a Legend.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">

        {/* Filters (Placeholder) */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {['ALL', 'CHALLENGER', 'GRANDMASTER', 'MASTER'].map(t => (
            <button
              key={t}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all
                        ${t === tier ? 'bg-lol-gold text-black' : 'bg-[#121212] border border-white/10 text-gray-400 hover:text-white hover:border-white/30'}
                    `}
            >
              {t}
            </button>
          ))}
        </div>

        <LeaderboardTable region={region} tier={tier} mePuuid={mePuuid} />
      </div>

      {/* Sticky Me Bar (Only if logged in / puuid available) */}
      {mePuuid && <LeaderboardMeBar region={region} puuid={mePuuid} />}
    </div>
  );
}