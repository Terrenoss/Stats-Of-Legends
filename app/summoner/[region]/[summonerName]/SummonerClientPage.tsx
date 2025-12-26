"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProfileHeader } from '../../../../components/ProfileHeader';
import { ChampionsTable } from '../../../../components/ChampionsTable';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { MatchSkeleton } from '../../../../components/skeletons/MatchSkeleton';
import { LiveGame } from '../../../../components/LiveGame';
import { TRANSLATIONS } from '../../../../constants';
import { SummonerProfile, Match, Language, GameMode, HeatmapDay, DetailedChampionStats, Teammate } from '../../../../types';
import { LayoutDashboard, Sword, Radio, TrendingUp } from 'lucide-react';
import { SafeLink } from '../../../../components/ui/SafeLink';
import { OverviewTab } from './OverviewTab';
import { ProgressionTab } from './ProgressionTab';

export default function SummonerClientPage({ params }: { params: { region: string, summonerName: string } }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SummonerProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [champions, setChampions] = useState<DetailedChampionStats[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [profileTab, setProfileTab] = useState<'overview' | 'champions' | 'live' | 'progression'>('overview');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'SOLO' | 'FLEX'>('ALL');
  const [currentLang] = useState<Language>('FR');
  const [performance, setPerformance] = useState<any>(null);
  const [lpHistory, setLpHistory] = useState<any[]>([]);
  const [visibleMatches, setVisibleMatches] = useState(10);

  const [version, setVersion] = useState<string>('15.24.1'); // Default fallback

  const t = TRANSLATIONS[currentLang];

  const loadData = async () => {
    setLoading(true);
    setUpdateError(null);
    const nameParam = decodeURIComponent(params.summonerName as string);
    let name = nameParam;
    let tag = params.region as string;

    if (nameParam.includes('-')) {
      [name, tag] = nameParam.split('-');
    }

    try {
      const url = new URL(`/api/summoner`, window.location.origin);
      url.searchParams.append('region', params.region);
      url.searchParams.append('name', name);
      url.searchParams.append('tag', tag);
      if (updating) {
        url.searchParams.append('force', 'true');
      }

      const res = await fetch(url.toString());

      if (res.ok) {
        const realData = await res.json();

        setProfile(realData.profile as SummonerProfile);
        setMatches(realData.matches as Match[]);
        setHeatmap(realData.heatmap as HeatmapDay[]);
        setChampions(realData.champions as DetailedChampionStats[]);
        setTeammates(realData.teammates as Teammate[]);
        setLpHistory(realData.lpHistory || []);
        setPerformance(realData.performance || null);
        if (realData.version) setVersion(realData.version);
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.error === 'RIOT_FORBIDDEN') {
          setUpdateError('Impossible de mettre à jour les données : accès Riot API refusé (403).');
        } else {
          setUpdateError('Échec de la mise à jour des données du joueur.');
        }
        throw new Error('Fetch summoner failed');
      }

    } catch (e) {
      console.error('Failed to fetch summoner', e);
      setProfile(null);
      setMatches([]);
      setHeatmap([]);
      setChampions([]);
      setTeammates([]);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.region, params.summonerName]);

  const handleUpdateClick = async () => {
    setUpdating(true);
    await loadData();
  };

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
  const rankColor = profile?.ranks?.solo?.tier ? getRankColor(profile.ranks.solo.tier) : '#ffd700';

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
      <SafeLink href="/" className="mb-6 text-sm text-gray-500 hover:text-white transition inline-flex items-center gap-1">
        <span>←</span> {t.back}
      </SafeLink>

      {updateError && (
        <div className="mb-4 rounded-lg bg-red-900/60 border border-red-700 text-red-100 px-4 py-2 text-sm font-bold">
          {updateError}
        </div>
      )}

      <ProfileHeader profile={profile} lang={currentLang} onUpdateRequest={handleUpdateClick} lpHistory={lpHistory} version={version} />

      {updating && (
        <div className="mt-2 mb-4 text-xs text-gray-400 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-lol-gold border-t-transparent animate-spin"></span>
          <span>Mise à jour des données...</span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex gap-6 border-b border-white/5 mb-8">
        <TabButton active={profileTab === 'overview'} onClick={() => setProfileTab('overview')} icon={<LayoutDashboard size={16} />} label={t.overview} />
        <TabButton active={profileTab === 'champions'} onClick={() => setProfileTab('champions')} icon={<Sword size={16} />} label={t.champions} />
        <TabButton active={profileTab === 'progression'} onClick={() => setProfileTab('progression')} icon={<TrendingUp size={16} />} label="Progression LP" />
        <TabButton active={profileTab === 'live'} onClick={() => setProfileTab('live')} icon={<Radio size={16} />} label={t.liveGame} />
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
