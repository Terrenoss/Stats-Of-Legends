'use client';

import React, { useState } from 'react';
import { ProfileHeader } from '../../../../components/ProfileHeader';
import { ChampionsTable } from '../../../../components/ChampionsTable';
import { LiveGame } from '../../../../components/LiveGame';
import { TRANSLATIONS } from '../../../../constants';
import { Match, Language, GameMode } from '../../../../types';
import { LayoutDashboard, Sword, Radio, TrendingUp } from 'lucide-react';
import { SafeLink } from '../../../../components/ui/SafeLink';
import { OverviewTab } from './OverviewTab';
import { ProgressionTab } from './ProgressionTab';
import { useSummonerData } from '@/hooks/useSummonerData';
import { SummonerPageSkeleton } from '@/components/skeletons/SummonerPageSkeleton';

const INITIAL_VISIBLE_MATCHES = 10;
const TAB_ICON_SIZE = 16;

export default function SummonerClientPage({ params }: { params: { region: string, summonerName: string } }) {
  const {
    loading,
    updating,
    updateError,
    profile,
    matches,
    heatmap,
    champions,
    teammates,
    performance,
    lpHistory,
    version,
    updateData
  } = useSummonerData(params.region, params.summonerName);

  const [profileTab, setProfileTab] = useState<'overview' | 'champions' | 'live' | 'progression'>('overview');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SOLO' | 'FLEX'>('ALL');
  const [currentLang] = useState<Language>('FR');
  const [visibleMatches, setVisibleMatches] = useState(INITIAL_VISIBLE_MATCHES);

  const t = TRANSLATIONS[currentLang];

  const mapGameMode = (m: Match): 'SOLO' | 'FLEX' | 'OTHER' => {
    const mode: any = m.gameMode;
    if (mode === GameMode.SOLO_DUO || mode === 'RANKED_SOLO_5x5') return 'SOLO';
    if (mode === GameMode.FLEX || mode === 'RANKED_FLEX_SR') return 'FLEX';
    return 'OTHER';
  };

  const filteredMatches = matchFilter === 'ALL'
    ? matches
    : matches.filter(m => {
      const kind = mapGameMode(m);
      if (matchFilter === 'SOLO') return kind === 'SOLO';
      if (matchFilter === 'FLEX') return kind === 'FLEX';
      return true;
    });

  // Helper to get rank color for chart
  const getRankColor = (tier: string | null) => {
    switch (tier?.toUpperCase()) {
      case 'IRON': return '#a19d94';
      case 'BRONZE': return '#cd7f32';
      case 'SILVER': return '#c0c0c0';
      case 'GOLD': return '#ffd700';
      case 'PLATINUM': return '#4ecdc4';
      case 'EMERALD': return '#2ecc71';
      case 'DIAMOND': return '#b9f2ff';
      case 'MASTER': return '#9b59b6';
      case 'GRANDMASTER': return '#e74c3c';
      case 'CHALLENGER': return '#f1c40f';
      default: return '#ffd700';
    }
  };
  const soloRank = (profile && profile.ranks) ? profile.ranks.solo : undefined;
  const tier = soloRank?.tier;
  const rankColor = tier ? getRankColor(tier) : '#ffd700';

  if (loading) {
    return <SummonerPageSkeleton />;
  }

  if (!profile) return <div className="text-center py-20 text-xl">Invocateur introuvable</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <SafeLink href="/" className="mb-6 text-sm text-gray-500 hover:text-white transition inline-flex items-center gap-1">
        <span>←</span> {t.back}
      </SafeLink>

      {updateError && (
        <div className="mb-4 rounded-lg bg-red-900/60 border border-red-700 text-red-100 px-4 py-2 text-sm font-bold">
          {updateError}
        </div>
      )}

      <ProfileHeader profile={profile} lang={currentLang} onUpdateRequest={updateData} lpHistory={lpHistory} version={version} />

      {updating && (
        <div className="mt-2 mb-4 text-xs text-gray-400 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-lol-gold border-t-transparent animate-spin"></span>
          <span>Mise à jour des données...</span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex gap-6 border-b border-white/5 mb-8">
        <TabButton active={profileTab === 'overview'} onClick={() => setProfileTab('overview')} icon={<LayoutDashboard size={TAB_ICON_SIZE} />} label={t.overview} />
        <TabButton active={profileTab === 'champions'} onClick={() => setProfileTab('champions')} icon={<Sword size={TAB_ICON_SIZE} />} label={t.champions} />
        <TabButton active={profileTab === 'progression'} onClick={() => setProfileTab('progression')} icon={<TrendingUp size={TAB_ICON_SIZE} />} label="Progression LP" />
        <TabButton active={profileTab === 'live'} onClick={() => setProfileTab('live')} icon={<Radio size={TAB_ICON_SIZE} />} label={t.liveGame} />
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {profileTab === 'overview' && (
        <OverviewTab
          performance={performance}
          heatmap={heatmap}
          champions={champions}
          teammates={teammates}
          filteredMatches={filteredMatches}
          visibleMatches={visibleMatches}
          setVisibleMatches={setVisibleMatches}
          matchFilter={matchFilter}
          setMatchFilter={setMatchFilter}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* TAB CONTENT: CHAMPIONS */}
      {profileTab === 'champions' && (
        <ChampionsTable champions={champions} lang={currentLang} />
      )}

      {/* TAB CONTENT: PROGRESSION LP */}
      {profileTab === 'progression' && (
        <ProgressionTab lpHistory={lpHistory} rankColor={rankColor} />
      )}

      {/* TAB CONTENT: LIVE GAME */}
      {profileTab === 'live' && (
        <LiveGame summonerName={profile.name} tag={profile.tag} region={params.region as string} />
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
