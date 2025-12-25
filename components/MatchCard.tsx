"use client";

import React, { useState, useEffect } from 'react';
import { Match, GameMode } from '../types';
import { CURRENT_PATCH } from '../constants';
import { ChevronDown } from 'lucide-react';
import { useI18n } from "../app/LanguageContext";
import { MatchSummary } from './match/tabs/MatchSummary';
import { MatchScore } from './match/tabs/MatchScore';
import { MatchTeamAnalysis } from './match/tabs/MatchTeamAnalysis';
import { MatchBuild } from './match/tabs/MatchBuild';
import { MatchOther } from './match/tabs/MatchOther';
import { getAverageRank } from '../utils/rankUtils';
import { getChampionIconUrl } from '../utils/ddragon';

interface MatchCardProps {
  match: Match;
  region?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, region = 'EUW' }) => {
  const me: any = match.me ?? {};
  const isWin = !!me.win;
  const kills = Number(me.kills ?? 0);
  const deaths = Number(me.deaths ?? 0);
  const assists = Number(me.assists ?? 0);
  const kda = ((kills + assists) / Math.max(1, deaths)).toFixed(2);
  const durationSecondsTotal = Number(match.gameDuration ?? 0);
  const durationMin = Math.floor(durationSecondsTotal / 60);
  const durationSec = durationSecondsTotal % 60;
  const csPerMinHeader = (Number(me.cs ?? 0) && durationSecondsTotal > 0) ? +((Number(me.cs ?? 0) / (durationSecondsTotal / 60))).toFixed(1) : 0;
  const version = match.gameVersion?.split('.').slice(0, 2).join('.') ?? '14.1';

  const [activeTab, setActiveTab] = useState<'NONE' | 'SUMMARY' | 'SCORE' | 'TEAM' | 'BUILD' | 'OTHER'>('NONE');
  const [ranks, setRanks] = useState<Record<string, any>>({});
  const [ranksLoaded, setRanksLoaded] = useState(false);

  const { t, lang } = useI18n();

  const getQueueLabel = () => {
    if (match.queueId === 420) return t.rankSolo;
    if (match.queueId === 440) return t.rankFlex;
    if (match.queueId === 450) return 'ARAM';
    if (match.queueId === 400 || match.queueId === 430) return t.normal;

    const mode = match.gameMode as any;
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

  const getRankIcon = (tier: string) => {
    if (!tier || tier === 'Unranked') return null;
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
  };

  const fetchRanks = async () => {
    if (ranksLoaded) return;
    try {
      const puuids = match.participants.map((p: any) => p.puuid).filter(Boolean);
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

  const maxDamage = Math.max(...(Array.isArray(match.participants) ? match.participants.map((p: any) => Number(p.totalDamageDealtToChampions ?? 0)) : [0]));
  const maxTaken = Math.max(...(Array.isArray(match.participants) ? match.participants.map((p: any) => Number(p.totalDamageTaken ?? 0)) : [0]));

  const champImg = me?.champion?.imageUrl ?? null;
  const champName = me?.champion?.name ?? 'Unknown';
  const spells = Array.isArray(me?.spells) ? me.spells : ([] as any[]);
  const displaySummoner = me?.summonerName ? (me.summonerName + (me.tagLine ? `#${me.tagLine}` : '')) : (me?.summonerName ?? 'Unranked');
  const displayRank = me?.rank || 'Unranked';

  const getGradeColor = (grade?: string) => {
    if (grade === 'S+' || grade === 'S') return 'text-yellow-400';
    if (grade === 'A') return 'text-emerald-400';
    if (grade === 'B') return 'text-blue-400';
    return 'text-gray-400';
  };

  const containerClass = `mb-2 relative rounded-[1rem] border transition-all duration-300 group
    ${isWin
      ? 'border-lol-win/20 bg-[#0a120f] hover:bg-[#0f1a15]' // Win: Very dark green/black
      : 'border-red-900/20 bg-gradient-to-r from-[#1a0505] to-[#0f0505] hover:to-[#2a0a0a]' // Loss: Dark Red/Black "Blood Moon"
    }
  `;

  // MVP Check
  const myScore = me.legendScore || 0;
  const maxScore = Math.max(...(match.participants || []).map((p: any) => p.legendScore || 0));
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
                validRanks = match.participants.map((p: any) => p.rank).filter(Boolean);
              }
              avgRank = getAverageRank(validRanks);
            }

            const tier = avgRank.split(' ')[0];
            const icon = getRankIcon(tier);
            return icon ? (
              <img src={icon} alt={avgRank} title={avgRank} className="w-[350px] h-[350px] max-w-none object-contain drop-shadow-2xl" />
            ) : null;
          })()}
        </div>
      </div>
      {/* Main Card Content (Collapsed) */}
      <div className="p-3 pl-5 flex flex-col md:flex-row gap-4 items-center relative z-10">
        {/* Side Indicator - The main color cue */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[1rem] ${isWin ? 'bg-lol-win shadow-[0_0_15px_#22c55e]' : 'bg-red-900/50'}`}></div>

        {/* Game Info */}
        <div className="w-full md:w-28 flex flex-col gap-0.5">
          <span className={`font-bold font-display uppercase tracking-wider text-[9px] ${isWin ? 'text-lol-win' : 'text-gray-600'}`}>
            {getQueueLabel()}
          </span>
          <span className="text-[9px] text-gray-600 font-bold">{getTimeAgo()}</span>
          <span className={`font-black text-lg tracking-tight ${isWin ? 'text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-gray-500'}`}>{isWin ? t.win : t.loss}</span>
          <span className="text-[10px] text-gray-600 font-mono">{durationMin}m {durationSec}s</span>
        </div>

        {/* Champion & Spells */}
        <div className="flex gap-3 items-center">
          <div className="relative group">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg ${isWin ? 'border-lol-win' : 'border-lol-loss'}`}>
              <img
                src={getChampionIconUrl(champName)}
                alt={champName}
                className="w-full h-full object-cover transform hover:scale-110 transition-transform"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#0a0a0a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20">
              {me.champLevel}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {spells.map((spell: any, idx: number) => (
              <img key={spell.id ?? spell ?? idx} src={spell.imageUrl} alt={spell.name ?? ''} className="w-6 h-6 md:w-7 md:h-7 rounded-md border border-white/10 bg-[#121212]" />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {me?.runes?.primary ? (
              <img src={me.runes.primary} alt="Keystone" className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-lol-gold/50 object-cover" />
            ) : (
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-lol-gold/50 flex items-center justify-center text-[10px] font-bold text-lol-gold">R</div>
            )}
            {me?.runes?.secondary ? (
              <img src={me.runes.secondary} alt="Secondary Rune" className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-gray-700 object-cover p-1" />
            ) : (
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">S</div>
            )}
          </div>
        </div>

        {/* KDA Stats */}
        <div className="flex flex-col items-center w-32 relative">
          {/* MVP Badge */}
          {(() => {
            const myScore = me.legendScore || 0;
            const maxScore = Math.max(...(match.participants || []).map((p: any) => p.legendScore || 0));
            const isMvp = myScore > 0 && myScore === maxScore;

            if (isMvp && isWin) {
              return (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-t-lg shadow-[0_-2px_10px_rgba(255,215,0,0.5)] z-20 animate-pulse">
                  MVP
                </div>
              );
            }
            return null;
          })()}

          <div className="text-xl font-display font-black text-white tracking-widest">
            {kills} <span className="text-gray-500 text-sm">/</span> <span className="text-lol-red">{deaths}</span> <span className="text-gray-500 text-sm">/</span> {assists}
          </div>
          <div className={`text-xs font-mono mt-0.5 font-bold ${Number(kda) >= 5 ? 'text-orange-500 animate-burn font-black' : Number(kda) >= 4 ? 'text-lol-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : Number(kda) >= 3 ? 'text-blue-400' : 'text-gray-400'}`}>
            {kda} KDA
          </div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">P/Kill {Math.round(((kills + assists) / Math.max(1, (isWin ? match.participants.filter((p: any) => p.win) : match.participants.filter((p: any) => !p.win)).reduce((a: number, b: any) => a + b.kills, 0))) * 100)}%</div>
        </div>

        {/* Legend Score Badge */}
        <div className="flex flex-col items-center justify-center w-16 hidden md:flex relative group">
          <div className={`text-xl font-black font-display ${getGradeColor(me.legendScoreGrade)}`}>
            {me.legendScoreGrade || '-'}
          </div>
          <div className="text-[10px] text-gray-500 font-bold">
            {me.legendScore?.toFixed(0) || '-'} <span className="text-[8px]">/ 100</span>
          </div>

          {/* V2: Confidence & Contribution Tooltip/Badge */}
          {(me.legendScoreSampleSize !== undefined && me.legendScoreSampleSize < 10) && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-500 rounded-full border border-black" title="Low Sample Size (<10 matches) - Score may be volatile"></div>
          )}
          {me.legendScoreContribution !== undefined && me.legendScoreContribution > 0.01 && (
            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">+{Math.round(me.legendScoreContribution * 100)}% Win</div>
          )}
        </div>

        {/* Items */}
        <div className="grid grid-cols-4 gap-1 max-w-[120px]">
          {(() => {
            // Backend now returns exactly 7 items (indices 0-6), with id=0 for empty slots.
            const rawItems = Array.isArray(me?.items) ? me.items : [];
            // Ensure we have 7 items just in case
            const safeItems = [...rawItems];
            while (safeItems.length < 7) safeItems.push({ id: 0 });

            // Order: Top Row [0, 1, 2, 6(Trinket)], Bottom Row [3, 4, 5]
            const orderedItems = [
              safeItems[0], safeItems[1], safeItems[2], safeItems[6],
              safeItems[3], safeItems[4], safeItems[5]
            ];

            return orderedItems.map((item: any, idx: number) => (
              item?.id && item.id !== 0 ? (
                <img key={`item-${idx}`} src={item.imageUrl} alt={item.name ?? ''} className={`w-6 h-6 rounded-md bg-[#121212] border border-white/10 ${idx === 3 ? 'rounded-full' : ''}`} title={item.name ?? ''} />
              ) : (
                <div key={`empty-${idx}`} className="w-6 h-6 rounded-md bg-white/5 border border-white/5"></div>
              )
            ));
          })()}
        </div>

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
        <div className="flex border-t border-white/5 bg-[#121212]">
          <button onClick={() => setActiveTab('SUMMARY')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'SUMMARY' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Vue d'ensemble</button>
          <button onClick={() => setActiveTab('SCORE')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'SCORE' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Legend Score</button>
          <button onClick={() => setActiveTab('TEAM')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'TEAM' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Analyse d'équipe</button>
          <button onClick={() => setActiveTab('BUILD')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'BUILD' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Build</button>
          <button onClick={() => setActiveTab('OTHER')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'OTHER' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Autre</button>
        </div>
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
