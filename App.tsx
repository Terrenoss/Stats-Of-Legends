"use client";

import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Builder } from './components/Builder';
import { HomeView } from './components/views/HomeView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { ProfileView } from './components/views/ProfileView';
import { MOCK_MATCHES, MOCK_PROFILE, TRANSLATIONS } from './constants';
import { ANIMATION_DURATION_MS } from './constants/api';
import { SummonerProfile, Match, Language, Region } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'builder' | 'leaderboard'>('home');
  const [currentProfile, setCurrentProfile] = useState<SummonerProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>('FR');

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
    }, ANIMATION_DURATION_MS);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
    if (view === 'home') {
      setCurrentProfile(null);
      setIsSearching(false);
    }
  };

  const renderContent = () => {
    if (currentView === 'builder') {
      return <Builder lang={currentLang} />;
    }

    if (currentView === 'leaderboard') {
      return <LeaderboardView t={t} />;
    }

    if (!currentProfile) {
      return (
        <HomeView
          onSearch={handleSearch}
          lang={currentLang}
          t={t}
          onBuilderClick={() => setCurrentView('builder')}
        />
      );
    }

    return (
      <ProfileView
        profile={currentProfile}
        matches={matches}
        lang={currentLang}
        onBack={() => setCurrentProfile(null)}
        t={t}
        isSearching={isSearching}
      />
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

export default App;