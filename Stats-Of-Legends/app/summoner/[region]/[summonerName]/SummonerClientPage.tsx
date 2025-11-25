
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '../../../../components/ProfileHeader';
import { MatchCard } from '../../../../components/MatchCard';
import { ActivityHeatmap } from '../../../../components/ActivityHeatmap';
import { PerformanceRadar } from '../../../../components/PerformanceRadar';
import { ChampionsTable } from '../../../../components/ChampionsTable';
import { RecentlyPlayedWith } from '../../../../components/RecentlyPlayedWith';
import { WinrateSummary } from '../../../../components/WinrateSummary';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { MatchSkeleton } from '../../../../components/skeletons/MatchSkeleton';
import { LiveGame } from '../../../../components/LiveGame';
import { MOCK_MATCHES, MOCK_PROFILE, TRANSLATIONS, MOCK_HEATMAP_DATA, MOCK_DETAILED_CHAMPIONS, MOCK_TEAMMATES } from '../../../../constants';
import { SummonerProfile, Match, Language, GameMode } from '../../../../types';
import { LayoutDashboard, Sword, Radio } from 'lucide-react';
import { SafeLink } from '../../../../components/ui/SafeLink';

export default function SummonerClientPage({ params }: { params: { region: string, summonerName: string } }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SummonerProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [profileTab, setProfileTab] = useState<'overview' | 'champions' | 'live'>('overview');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SOLO' | 'FLEX'>('ALL');
  const [currentLang] = useState<Language>('FR');

  const t = TRANSLATIONS[currentLang];

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const nameParam = decodeURIComponent(params.summonerName as string);
        let name = nameParam;
        let tag = params.region as string; 
        
        if (nameParam.includes('-')) {
            [name, tag] = nameParam.split('-');
        }

        try {
            const res = await fetch(`/api/summoner?region=${params.region}&name=${name}&tag=${tag}`);
            
            if (res.ok) {
                const realData = await res.json();
                
                const soloLeague = realData.leagues.find((l: any) => l.queueType === 'RANKED_SOLO_5x5');
                const flexLeague = realData.leagues.find((l: any) => l.queueType === 'RANKED_FLEX_SR');

                const mappedProfile: SummonerProfile = {
                    name: realData.account.gameName,
                    tag: realData.account.tagLine,
                    level: realData.summoner.summonerLevel,
                    profileIconId: realData.summoner.profileIconId,
                    ranks: {
                        solo: {
                            tier: soloLeague?.tier || 'UNRANKED',
                            rank: soloLeague?.rank || '',
                            lp: soloLeague?.leaguePoints || 0,
                            wins: soloLeague?.wins || 0,
                            losses: soloLeague?.losses || 0
                        },
                        flex: {
                            tier: flexLeague?.tier || 'UNRANKED',
                            rank: flexLeague?.rank || '',
                            lp: flexLeague?.leaguePoints || 0,
                            wins: flexLeague?.wins || 0,
                            losses: flexLeague?.losses || 0
                        }
                    },
                    pastRanks: MOCK_PROFILE.pastRanks,
                    ladderRank: 0,
                    topPercent: 0,
                    lastUpdated: Date.now()
                };
                
                setProfile(mappedProfile);
                setMatches(MOCK_MATCHES); 
            } else {
                throw new Error("Use Mock");
            }

        } catch (e) {
            console.log("Falling back to mock data");
            setProfile({
                ...MOCK_PROFILE,
                name: name,
                tag: tag
            });
            setMatches(MOCK_MATCHES);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [params]);

  const filteredMatches = matchFilter === 'ALL' 
    ? matches 
    : matches.filter(m => matchFilter === 'SOLO' ? m.gameMode === GameMode.SOLO_DUO : m.gameMode === GameMode.FLEX);

  if (loading) {
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
  }

  if (!profile) return <div className="text-center py-20 text-xl">Invocateur introuvable</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <SafeLink href="/" className="mb-6 text-sm text-gray-500 hover:text-white transition flex items-center gap-1 inline-flex">
           <span>←</span> {t.back}
        </SafeLink>

        <ProfileHeader profile={profile} lang={currentLang} />
        
        {/* TABS NAVIGATION */}
        <div className="flex gap-6 border-b border-white/5 mb-8">
            <TabButton active={profileTab === 'overview'} onClick={() => setProfileTab('overview')} icon={<LayoutDashboard size={16}/>} label={t.overview} />
            <TabButton active={profileTab === 'champions'} onClick={() => setProfileTab('champions')} icon={<Sword size={16}/>} label={t.champions} />
            <TabButton active={profileTab === 'live'} onClick={() => setProfileTab('live')} icon={<Radio size={16}/>} label={t.liveGame} />
        </div>

        {/* TAB CONTENT: OVERVIEW */}
        {profileTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Sidebar + Heatmap) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="h-72 bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl relative">
                    <h3 className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4 absolute top-6 left-6 z-10">Radar Stats</h3>
                    <PerformanceRadar />
                </div>
                
                <ActivityHeatmap data={MOCK_HEATMAP_DATA} lang={currentLang} />
                
                {/* Champions List */}
                <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 shadow-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">{t.playedChamps}</h3>
                    <div className="space-y-4">
                    {MOCK_DETAILED_CHAMPIONS.slice(0, 5).map(champ => (
                        <div key={champ.id} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition">
                            <div className="flex items-center gap-3">
                            <img src={champ.imageUrl} className="w-8 h-8 rounded-lg border border-gray-700 group-hover:border-lol-gold transition" alt="Champ" />
                            <div className="flex flex-col">
                                <span className="text-gray-300 group-hover:text-white font-bold">{champ.name}</span>
                                <span className="text-[10px] text-gray-600 font-mono">{champ.kda.toFixed(2)} KDA</span>
                            </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                            <div className={`font-bold ${champ.wins/champ.games > 0.5 ? 'text-lol-win' : 'text-gray-500'}`}>
                                {Math.round((champ.wins/champ.games)*100)}%
                            </div>
                            <div className="text-gray-600 text-[10px]">{champ.games} games</div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                <RecentlyPlayedWith teammates={MOCK_TEAMMATES} lang={currentLang} />
            </div>

            {/* Right Column (Match History) */}
            <div className="lg:col-span-8">
                <div className="mb-6">
                    <WinrateSummary matches={matches} lang={currentLang} />
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
                    <MatchCard key={match.id} match={match} lang={currentLang} />
                ))}
                {filteredMatches.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm font-bold">No matches found for this filter.</div>
                )}
                </div>
            </div>
            </div>
        )}

        {/* TAB CONTENT: CHAMPIONS */}
        {profileTab === 'champions' && (
            <ChampionsTable champions={MOCK_DETAILED_CHAMPIONS} lang={currentLang} />
        )}
        
        {/* TAB CONTENT: LIVE GAME */}
        {profileTab === 'live' && (
            <LiveGame summonerName={profile.name} />
        )}
    </div>
  );
}

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
