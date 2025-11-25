"use client";

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchHero } from './components/SearchHero';
import { MatchCard } from './components/MatchCard';
import { ProfileHeader } from './components/ProfileHeader';
import { Builder } from './components/Builder';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { PerformanceRadar } from './components/PerformanceRadar';
import { ChampionsTable } from './components/ChampionsTable';
import { RecentlyPlayedWith } from './components/RecentlyPlayedWith';
import { WinrateSummary } from './components/WinrateSummary';
import { MOCK_MATCHES, MOCK_PROFILE, TRANSLATIONS, MOCK_HEATMAP_DATA, MOCK_DETAILED_CHAMPIONS, MOCK_TEAMMATES } from './constants';
import { SummonerProfile, Match, Language, Region, GameMode } from './types';
import { Trophy, LayoutDashboard, Sword, Radio } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'builder' | 'leaderboard'>('home');
  const [currentProfile, setCurrentProfile] = useState<SummonerProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>('FR');

  // Profile Sub-tabs
  const [profileTab, setProfileTab] = useState<'overview' | 'champions' | 'live'>('overview');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SOLO' | 'FLEX'>('ALL');

  const t = TRANSLATIONS[currentLang];

  const handleSearch = (query: string, region: Region) => {
    setIsSearching(true);
    setCurrentView('home'); 
    
    // Auto-append region tag if missing
    let fullQuery = query;
    if (!fullQuery.includes('#')) {
        fullQuery = `${fullQuery}#${region}`;
    }

    const [summonerName, tagName] = fullQuery.split('#');

    // Simulate API network delay
    setTimeout(() => {
      setCurrentProfile({
        ...MOCK_PROFILE,
        name: summonerName || "Summoner",
        tag: tagName || region
      });
      setMatches(MOCK_MATCHES);
      setIsSearching(false);
    }, 800);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
    if (view === 'home') {
      setCurrentProfile(null);
      setIsSearching(false);
    }
  };

  const getFilteredMatches = () => {
     if (matchFilter === 'ALL') return matches;
     if (matchFilter === 'SOLO') return matches.filter(m => m.gameMode === GameMode.SOLO_DUO);
     if (matchFilter === 'FLEX') return matches.filter(m => m.gameMode === GameMode.FLEX);
     return matches;
  };

  const filteredMatches = getFilteredMatches();

  const renderContent = () => {
    if (currentView === 'builder') {
      return <Builder lang={currentLang} />;
    }

    if (currentView === 'leaderboard') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
           <div className="w-20 h-20 bg-lol-dark border border-lol-gold rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
             <Trophy className="w-10 h-10 text-lol-gold" />
           </div>
           <h2 className="text-3xl font-display font-bold text-white mb-2">Classement Challenger</h2>
           <p className="text-gray-400 max-w-md">
             {t.maintenance}
           </p>
        </div>
      );
    }

    if (!currentProfile) {
      return (
        <div className="animate-fadeIn">
          <SearchHero onSearch={handleSearch} lang={currentLang} />
          
          <div className="max-w-7xl mx-auto px-4 py-20">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <FeatureCard icon="⚡" title={t.realTime} desc={t.realTimeDesc} color="purple" />
                <FeatureCard icon="🤖" title={t.aiCoach} desc={t.aiCoachDesc} color="gold" />
                <FeatureCard icon="⚔️" title="Builder Noxus" desc={t.builderDesc} color="red" onClick={() => setCurrentView('builder')} />
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <button onClick={() => setCurrentProfile(null)} className="mb-6 text-sm text-gray-500 hover:text-white transition flex items-center gap-1">← {t.back}</button>

        {isSearching ? (
           <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lol-gold"></div>
           </div>
        ) : (
          <>
            <ProfileHeader profile={currentProfile} lang={currentLang} />
            
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

                   {/* Moved Below Champions */}
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
                      <MatchCard key={match.id} match={match} />
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
               <div className="flex flex-col items-center justify-center h-96 bg-[#121212] border border-white/5 rounded-[2rem]">
                  <Radio className="w-16 h-16 text-lol-red animate-pulse mb-6" />
                  <h3 className="text-2xl font-display font-bold text-white uppercase tracking-wider">Le joueur n'est pas en jeu</h3>
                  <p className="text-gray-500 mt-2">Revenez quand une partie aura commencé.</p>
               </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        currentView={currentView} 
        onNavigate={handleNavigate}
      />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
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

const FeatureCard = ({ icon, title, desc, color, onClick }: any) => (
  <div onClick={onClick} className={`p-6 rounded-[2rem] bg-[#121212] border border-white/5 hover:border-${color === 'gold' ? 'lol-gold' : color + '-500'}/50 transition group cursor-pointer relative overflow-hidden`}>
     <div className={`absolute top-0 left-0 w-full h-1 bg-${color === 'gold' ? 'lol-gold' : color === 'red' ? 'lol-red' : 'lol-hextech'}`}></div>
     <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
     <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">{title}</h3>
     <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);

export default App;