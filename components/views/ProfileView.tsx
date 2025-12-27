import React, { useState } from 'react';
import { ProfileHeader } from '../ProfileHeader';
import { PerformanceRadar } from '../PerformanceRadar';
import { ActivityHeatmap } from '../ActivityHeatmap';
import { RecentlyPlayedWith } from '../RecentlyPlayedWith';
import { WinrateSummary } from '../WinrateSummary';
import { MatchCard } from '../MatchCard';
import { ChampionsTable } from '../ChampionsTable';
import { LayoutDashboard, Sword, Radio } from 'lucide-react';
import { getChampionIconUrl } from '../../utils/ddragon';
import { MOCK_HEATMAP_DATA, MOCK_DETAILED_CHAMPIONS, MOCK_TEAMMATES } from '../../constants';
import { SummonerProfile, Match, Language, GameMode } from '../../types';

interface ProfileViewProps {
    profile: SummonerProfile;
    matches: Match[];
    lang: Language;
    onBack: () => void;
    t: any;
    isSearching: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, matches, lang, onBack, t, isSearching }) => {
    const [profileTab, setProfileTab] = useState<'overview' | 'champions' | 'live'>('overview');
    const [matchFilter, setMatchFilter] = useState<'ALL' | 'SOLO' | 'FLEX'>('ALL');

    const getFilteredMatches = () => {
        if (matchFilter === 'ALL') return matches;
        if (matchFilter === 'SOLO') return matches.filter(m => m.gameMode === GameMode.SOLO_DUO);
        if (matchFilter === 'FLEX') return matches.filter(m => m.gameMode === GameMode.FLEX);
        return matches;
    };

    const filteredMatches = getFilteredMatches();

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            <button onClick={onBack} className="mb-6 text-sm text-gray-500 hover:text-white transition flex items-center gap-1">← {t.back}</button>

            {isSearching ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lol-gold"></div>
                </div>
            ) : (
                <>
                    <ProfileHeader profile={profile} lang={lang} />

                    {/* TABS NAVIGATION */}
                    <div className="flex gap-6 border-b border-white/5 mb-8">
                        <TabButton active={profileTab === 'overview'} onClick={() => setProfileTab('overview')} icon={<LayoutDashboard size={16} />} label={t.overview} />
                        <TabButton active={profileTab === 'champions'} onClick={() => setProfileTab('champions')} icon={<Sword size={16} />} label={t.champions} />
                        <TabButton active={profileTab === 'live'} onClick={() => setProfileTab('live')} icon={<Radio size={16} />} label={t.liveGame} />
                    </div>

                    {/* TAB CONTENT: OVERVIEW */}
                    {profileTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column (Sidebar + Heatmap) */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="h-72 bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl relative">
                                    <h3 className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4 absolute top-6 left-6 z-10">Radar Stats</h3>
                                    {(() => {
                                        const metrics = profile?.metrics || null;
                                        const badge = profile?.consistencyBadge;
                                        return <PerformanceRadar metrics={metrics} consistencyBadge={badge} />;
                                    })()}
                                </div>

                                <ActivityHeatmap data={MOCK_HEATMAP_DATA} lang={lang} />

                                {/* Champions List */}
                                <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 shadow-xl">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">{t.playedChamps}</h3>
                                    <div className="space-y-4">
                                        {MOCK_DETAILED_CHAMPIONS.slice(0, 5).map(champ => (
                                            <div key={champ.id} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition">
                                                <div className="flex items-center gap-3">
                                                    <img src={getChampionIconUrl(champ.name)} className="w-8 h-8 rounded-lg border border-gray-700 group-hover:border-lol-gold transition" alt="Champ" />
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-300 group-hover:text-white font-bold">{champ.name}</span>
                                                        <span className="text-[10px] text-gray-600 font-mono">{champ.kda.toFixed(2)} KDA</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <WinRateDisplay wins={champ.wins} games={champ.games} />
                                                    <div className="text-gray-600 text-[10px]">{champ.games} games</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Moved Below Champions */}
                                <RecentlyPlayedWith teammates={MOCK_TEAMMATES} lang={lang} />
                            </div>

                            {/* Right Column (Match History) */}
                            <div className="lg:col-span-8">
                                <div className="mb-6">
                                    <WinrateSummary matches={matches} lang={lang} />
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
                                    {filteredMatches.map((match) => (
                                        <MatchCard key={match.id} match={match} />
                                    ))}
                                    {filteredMatches.length === 0 && (
                                        <div className="text-center py-10 text-gray-500 text-sm font-bold">No matches found for this filter.</div>
                                    )}
                                </div>
                            </div>
                        </div >
                    )
                    }

                    {/* TAB CONTENT: CHAMPIONS */}
                    {
                        profileTab === 'champions' && (
                            <ChampionsTable champions={MOCK_DETAILED_CHAMPIONS} lang={lang} />
                        )
                    }

                    {/* TAB CONTENT: LIVE GAME */}
                    {
                        profileTab === 'live' && (
                            <div className="flex flex-col items-center justify-center h-96 bg-[#121212] border border-white/5 rounded-[2rem]">
                                <Radio className="w-16 h-16 text-lol-red animate-pulse mb-6" />
                                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-wider">Le joueur n'est pas en jeu</h3>
                                <p className="text-gray-500 mt-2">Revenez quand une partie aura commencé.</p>
                            </div>
                        )
                    }
                </>
            )}
        </div >
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${active ? 'text-lol-gold border-lol-gold' : 'text-gray-500 border-transparent hover:text-white'}`}
    >
        {icon} {label}
    </button>
);

const FilterButton = ({ label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${active ? 'bg-lol-gold text-black border-lol-gold' : 'bg-[#121212] text-gray-500 border-white/10 hover:border-gray-500'}`}
    >
        {label}
    </button>
);

const WinRateDisplay = ({ wins, games }: { wins: number, games: number }) => {
    const winRate = wins / games;
    const wrClass = winRate > 0.5 ? 'text-lol-win' : 'text-gray-500';
    return (
        <div className={`font-bold ${wrClass}`}>
            {Math.round(winRate * 100)}%
        </div>
    );
};
