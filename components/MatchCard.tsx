"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Match, GameMode, Participant } from '../types';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from "../app/LanguageContext";
import { TRANSLATIONS } from '../constants';
import { MatchSummary } from './match/tabs/MatchSummary';
import { MatchScore } from './match/tabs/MatchScore';
import { MatchTeamAnalysis } from './match/tabs/MatchTeamAnalysis';
import { MatchBuild } from './match/tabs/MatchBuild';
import { MatchOther } from './match/tabs/MatchOther';
import { getAverageRank } from '../utils/rankUtils';
import { getChampionIconUrl } from '../utils/ddragon';
import { getRankIconUrl } from '../utils/formatUtils';
import { MatchInfo, ChampionInfo, KDAInfo, ItemsList, MatchCardTabs, LegendScoreBadge } from './match/card/MatchCardComponents';

interface MatchCardProps {
  match: Match;
  region?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, region = 'EUW' }) => {
  const me = match.me || ({} as Participant);
  const isWin = !!me.win;
  const kills = Number(me.kills ?? 0);
  const deaths = Number(me.deaths ?? 0);
  const assists = Number(me.assists ?? 0);
  const kda = ((kills + assists) / Math.max(1, deaths)).toFixed(2);
  const durationSecondsTotal = Number(match.gameDuration ?? 0);
  const durationMin = Math.floor(durationSecondsTotal / 60);
  const durationSec = durationSecondsTotal % 60;
  const getCsPerMin = () => {
    const cs = Number(me.cs ?? 0);
    if (cs > 0 && durationSecondsTotal > 0) {
      return +((cs / (durationSecondsTotal / 60))).toFixed(1);
    }
    return 0;
  };
  const csPerMinHeader = getCsPerMin();

  const [activeTab, setActiveTab] = useState<'NONE' | 'SUMMARY' | 'SCORE' | 'TEAM' | 'BUILD' | 'OTHER'>('NONE');
  const [ranks, setRanks] = useState<Record<string, any>>({});
  const [ranksLoaded, setRanksLoaded] = useState(false);

  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const getQueueLabel = () => {
    if (match.queueId === 420) return t.rankSolo;
    if (match.queueId === 440) return t.rankFlex;
    if (match.queueId === 450) return 'ARAM';
    if (match.queueId === 400 || match.queueId === 430) return t.normal;

    const mode = match.gameMode as string;
    if (mode === GameMode.SOLO_DUO || mode === 'RANKED_SOLO_5x5') return t.rankSolo;
    if (mode === GameMode.FLEX || mode === 'RANKED_FLEX_SR') return 'Ranked Flex';
    if (mode === GameMode.ARAM || mode === 'ARAM') return 'ARAM';
    if (mode === GameMode.NORMAL || mode === 'NORMAL_5x5') return t.normal;
    return String(mode || t.normal);
  };

  const getTimeAgo = () => {
    const ts = typeof match.gameCreation === 'number' ? match.gameCreation : 0;
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const fetchRanks = async () => {
    if (ranksLoaded) return;
    try {
      const puuids = match.participants.map((p) => p.puuid).filter(Boolean);
      const res = await fetch('/api/match/ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, puuids, matchId: match.id })
      });
      if (res.ok) {
        const data = await res.json();
        setRanks(data);
        setRanksLoaded(true);
      }
    } catch (e) {
      console.error('Failed to fetch ranks', e);
    }
  };

  const toggleTab = (tab: typeof activeTab) => {
    if (activeTab === tab) {
      setActiveTab('NONE');
    } else {
      setActiveTab(tab);
      // Fetch ranks if expanding for the first time
      if (!ranksLoaded) {
        fetchRanks();
      }
    }
  };

  const participants = match.participants || [];
  const maxDamage = Math.max(...participants.map((p) => Number(p.totalDamageDealtToChampions || 0)), 0);
  const maxTaken = Math.max(...participants.map((p) => Number(p.totalDamageTaken || 0)), 0);

  const champName = me.champion?.name || 'Unknown';
  const spells = Array.isArray(me?.spells) ? me.spells : [];

  const containerClass = `mb-2 relative rounded-[1rem] border transition-all duration-300 group
    ${isWin
      ? 'border-lol-win/20 bg-[#0a120f] hover:bg-[#0f1a15]' // Win: Very dark green/black
      : 'border-red-900/20 bg-gradient-to-r from-[#1a0505] to-[#0f0505] hover:to-[#2a0a0a]' // Loss: Dark Red/Black "Blood Moon"
    }
  `;

  // MVP Check
  const myScore = me.legendScore || 0;
  const maxScore = Math.max(...(match.participants || []).map((p) => p.legendScore || 0));
  const isMvp = myScore > 0 && myScore === maxScore && isWin;

  return (
    <div className={containerClass} style={isMvp ? { borderColor: '#ffd700', boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' } : {}}>
      {/* Background Clipper for Particles & Rank */}
      <div className="absolute inset-0 overflow-hidden rounded-[1rem] pointer-events-none z-0">
        {/* Mythic MVP Particles */}
        {isMvp && (
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-challenger.png')] bg-repeat opacity-5 mix-blend-overlay animate-pulse-gold"></div>
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-yellow-500/5 to-transparent animate-spin-slow"></div>
          </div>
        )}
        {/* Rank Watermark - Subtle & Classy */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[40%] opacity-20 grayscale-[0.5] mix-blend-screen hidden md:block transition-all duration-500 group-hover:opacity-40 group-hover:grayscale-0 group-hover:translate-x-[35%]">
          {(() => {
            let avgRank = match.averageRank;

            if (!avgRank) {
              let validRanks: string[] = [];
              if (ranksLoaded && Object.keys(ranks).length > 0) {
                validRanks = Object.values(ranks).map((r: any) => r?.solo?.tier ? `${r.solo.tier} ${r.solo.rank}` : null).filter(Boolean) as string[];
              }
              if (validRanks.length === 0 && match.participants) {
                validRanks = match.participants.map((p) => p.rank).filter(Boolean) as string[];
              }
              avgRank = getAverageRank(validRanks);
            }

            const tier = avgRank.split(' ')[0];
            const icon = getRankIconUrl(tier);
            return icon ? (
              <Image src={icon} alt={avgRank} title={avgRank} width={350} height={350} className="max-w-none object-contain drop-shadow-2xl" />
            ) : null;
          })()}
        </div>
      </div>
      {/* Main Card Content (Collapsed) */}
      <div className="p-3 pl-5 flex flex-col md:flex-row gap-4 items-center relative z-10">
        {/* Side Indicator - The main color cue */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[1rem] ${isWin ? 'bg-lol-win shadow-[0_0_15px_#22c55e]' : 'bg-red-900/50'}`}></div>

        <MatchInfo
          details={{ isWin, durationMin, durationSec }}
          utils={{ getQueueLabel, getTimeAgo, t }}
        />
        <ChampionInfo isWin={isWin} champName={champName} me={me} spells={spells} getChampionIconUrl={getChampionIconUrl} />
        <KDAInfo
          stats={{ kills, deaths, assists, kda }}
          context={{ isWin, match, me }}
        />

        {/* Legend Score Badge */}
        <LegendScoreBadge me={me} />

        <ItemsList me={me} />

        {/* Stats Extra - Desktop */}
        <div className="hidden md:flex flex-col text-xs text-gray-400 border-l border-white/5 pl-4 gap-1 min-w-[100px] relative justify-center">
          <div className="flex justify-between w-full relative z-10"><span>CS</span> <span className="text-gray-200 font-bold">{me.cs ?? 0} ({csPerMinHeader}/m)</span></div>
          <div className="flex justify-between w-full relative z-10"><span>Vision</span> <span className="text-gray-200 font-bold">{me.visionScore ?? 0}</span></div>

        </div>

        {/* Toggle Button */}
        <div className="flex-grow flex justify-end">
          <button
            onClick={() => toggleTab(activeTab === 'NONE' ? 'SUMMARY' : 'NONE')}
            className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 ${activeTab !== 'NONE' ? 'bg-white/10 rotate-180 border-white/30 text-white' : 'text-gray-500'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Actions */}
      {activeTab !== 'NONE' && (
        <MatchCardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Tab Content */}
      {activeTab !== 'NONE' && (
        <div className="bg-[#0e0e0e] border-t border-white/5 p-4 animate-fadeIn">
          {activeTab === 'SUMMARY' && <MatchSummary participants={match.participants} maxDamage={maxDamage} maxTaken={maxTaken} ranks={ranks} lang={lang} region={region} gameDurationSeconds={match.gameDuration} teams={match.teams} />}
          {activeTab === 'SCORE' && <MatchScore participants={match.participants} timelineData={match.timelineData || []} me={me} averageRank={match.averageRank} />}
          {activeTab === 'TEAM' && <MatchTeamAnalysis participants={match.participants} maxDamage={maxDamage} maxTaken={maxTaken} />}
          {activeTab === 'BUILD' && <MatchBuild match={match} />}
          {activeTab === 'OTHER' && <MatchOther me={me} participants={match.participants} />}
        </div>
      )}
    </div>
  );
};
