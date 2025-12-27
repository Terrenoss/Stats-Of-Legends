import React from 'react';
import Image from 'next/image';
import { PerformanceRadar } from '../../../../components/PerformanceRadar';
import { ActivityHeatmap } from '../../../../components/ActivityHeatmap';
import { RecentlyPlayedWith } from '../../../../components/RecentlyPlayedWith';
import { WinrateSummary } from '../../../../components/WinrateSummary';
import { MatchCard } from '../../../../components/MatchCard';
import { DetailedChampionStats, Match, Teammate, HeatmapDay, Language } from '../../../../types';

const MATCH_LOAD_INCREMENT = 10;

interface OverviewTabProps {
    performance: any;
    heatmap: HeatmapDay[];
    champions: DetailedChampionStats[];
    teammates: Teammate[];
    filteredMatches: Match[];
    visibleMatches: number;
    setVisibleMatches: React.Dispatch<React.SetStateAction<number>>;
    matchFilter: 'ALL' | 'SOLO' | 'FLEX';
    setMatchFilter: (filter: 'ALL' | 'SOLO' | 'FLEX') => void;
    currentLang: Language;
    t: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    performance,
    heatmap,
    champions,
    teammates,
    filteredMatches,
    visibleMatches,
    setVisibleMatches,
    matchFilter,
    setMatchFilter,
    currentLang,
    t
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Sidebar + Heatmap) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="h-72 bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl relative">
                    <h3 className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4 absolute top-6 left-6 z-10">Radar Stats</h3>
                    <PerformanceRadar metrics={performance} />
                </div>

                <ActivityHeatmap data={heatmap} />

                {/* Champions List */}
                <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 shadow-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">{t.playedChamps}</h3>
                    <div className="space-y-4">
                        {champions.slice(0, 5).map(champ => (
                            <div key={champ.id} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-700 group-hover:border-lol-gold transition">
                                        <Image src={champ.imageUrl} alt={champ.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-300 group-hover:text-white font-bold">{champ.name}</span>
                                        <span className="text-[10px] text-gray-600 font-mono">{champ.kda.toFixed(2)} KDA</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className={`font-bold ${champ.wins / champ.games > 0.5 ? 'text-lol-win' : 'text-gray-500'}`}>
                                        {Math.round((champ.wins / champ.games) * 100)}%
                                    </div>
                                    <div className="text-gray-600 text-[10px]">{champ.games} games</div>
                                </div>
                            </div>
                        ))}
                        {champions.length === 0 && (
                            <div className="text-xs text-gray-600">Aucun champion récent trouvé.</div>
                        )}
                    </div>
                </div>

                <RecentlyPlayedWith teammates={teammates} lang={currentLang} />
            </div>

            {/* Right Column (Match History) */}
            <div className="lg:col-span-8">
                <div className="mb-6">
                    <WinrateSummary
                        matches={filteredMatches.slice(0, visibleMatches)}
                        lang={currentLang}
                        title={t.recent20Games.replace('20', String(filteredMatches.slice(0, visibleMatches).length))}
                    />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white font-display">{t.matchHistory}</h3>
                    <div className="flex gap-2 text-xs">
                        <FilterButton label="All" active={matchFilter === 'ALL'} onClick={() => setMatchFilter('ALL')} />
                        <FilterButton label="Ranked Solo" active={matchFilter === 'SOLO'} onClick={() => setMatchFilter('SOLO')} />
                        <FilterButton label="Ranked Flex" active={matchFilter === 'FLEX'} onClick={() => setMatchFilter('FLEX')} />
                    </div>
                </div>

                <div className="space-y-2">
                    {filteredMatches.slice(0, visibleMatches).map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                    {filteredMatches.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm font-bold">No matches found for this filter.</div>
                    )}

                    {visibleMatches < filteredMatches.length && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => setVisibleMatches(prev => prev + MATCH_LOAD_INCREMENT)}
                                className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-full border border-white/10 transition-all"
                            >
                                Load More Matches ({filteredMatches.length - visibleMatches} remaining)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FilterButton = ({ label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${active ? 'bg-lol-gold text-black border-lol-gold' : 'bg-[#121212] text-gray-500 border-white/10 hover:border-gray-500'
            }`}
    >
        {label}
    </button>
);
