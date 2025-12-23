"use client";

import React, { useState, useEffect } from 'react';
import { Match, GameMode } from '../types';
import { ChevronDown } from 'lucide-react';
import { useI18n } from "../app/LanguageContext";
import { MatchSummary } from './match/tabs/MatchSummary';
import { MatchScore } from './match/tabs/MatchScore';
import { MatchTeamAnalysis } from './match/tabs/MatchTeamAnalysis';
import { MatchBuild } from './match/tabs/MatchBuild';
import { MatchOther } from './match/tabs/MatchOther';
import { getAverageRank } from '../utils/rankUtils';

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

  const containerClass = 'mb-4 relative rounded-[1.5rem] overflow-hidden border transition-all duration-300 ' + (isWin ? 'border-lol-win/20 bg-[#0c1a15]/80 hover:bg-[#0c1a15]' : 'border-lol-loss/20 bg-[#1a0a0a]/80 hover:bg-[#1a0a0a]');

  return (
    <div className={containerClass}>
      {/* Rank Watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[50%] pointer-events-none opacity-40 z-0 hidden md:block">
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
            <img src={icon} alt={avgRank} title={avgRank} className="w-[500px] h-[500px] max-w-none object-contain drop-shadow-md" />
          ) : null;
        })()}
      </div>
      {/* Main Card Content (Collapsed) */}
      <div className="p-4 pl-6 flex flex-col md:flex-row gap-6 items-center relative z-10">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWin ? 'bg-lol-win' : 'bg-lol-loss'}`}></div>

        {/* Game Info */}
        <div className="w-full md:w-28 flex flex-col gap-1">
          <span className={`font-black font-display uppercase tracking-wider text-[10px] ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
            {getQueueLabel()}
          </span>
          <span className="text-[10px] text-gray-500 font-bold">{getTimeAgo()}</span>
          <span className={`font-black text-xl tracking-tight ${isWin ? 'text-white' : 'text-gray-500'}`}>{isWin ? t.win : t.loss}</span>
          <span className="text-xs text-gray-500 font-mono">{durationMin}m {durationSec}s</span>
        </div>

        {/* Champion & Spells */}
        <div className="flex gap-3 items-center">
          <div className="relative group">
            {champImg ? (
              <img
                src={champImg}
                alt={champName}
                className={`w-14 h-14 rounded-2xl border-2 ${isWin ? 'border-lol-win' : 'border-lol-loss'} object-cover shadow-lg`}
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isWin ? 'border-lol-win' : 'border-lol-loss'} bg-white/5 text-gray-200 font-bold`}>{(champName && typeof champName === 'string') ? champName.charAt(0) : '?'}</div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-[#121212] text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-gray-700 text-white font-bold shadow-md z-10">
              {me?.level ?? '-'}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {spells.map((spell: any, idx: number) => (
              <img key={spell.id ?? spell ?? idx} src={spell.imageUrl} alt={spell.name ?? ''} className="w-6 h-6 rounded-md border border-white/10 bg-[#121212]" />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {me?.runes?.primary ? (
              <img src={me.runes.primary} alt="Keystone" className="w-6 h-6 rounded-full bg-black border border-lol-gold/50 object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-black border border-lol-gold/50 flex items-center justify-center text-[10px] font-bold text-lol-gold">R</div>
            )}
            {me?.runes?.secondary ? (
              <img src={me.runes.secondary} alt="Secondary Rune" className="w-6 h-6 rounded-full bg-black border border-gray-700 object-cover p-1" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">S</div>
            )}
          </div>
        </div>

        {/* KDA Stats */}
        <div className="flex flex-col items-center w-32">
          <div className="text-xl font-display font-black text-white tracking-widest">
            {kills} <span className="text-gray-600 text-sm">/</span> <span className="text-lol-red">{deaths}</span> <span className="text-gray-600 text-sm">/</span> {assists}
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{kda} KDA</div>
          <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">P/Kill {Math.round(((kills + assists) / Math.max(1, (isWin ? match.participants.filter((p: any) => p.win) : match.participants.filter((p: any) => !p.win)).reduce((a: number, b: any) => a + b.kills, 0))) * 100)}%</div>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {(() => {
            const rawItems = Array.isArray(me?.items) ? me.items : [];
            const safeItems = [...rawItems];
            while (safeItems.length < 7) safeItems.push({ id: 0 });
            const orderedItems = [
              safeItems[0], safeItems[1], safeItems[2], safeItems[6],
              safeItems[3], safeItems[4], safeItems[5]
            ];
            return orderedItems.map((item: any, idx: number) => (
              item?.imageUrl ? (
                <img key={`item-${idx}`} src={item.imageUrl} alt={item.name ?? ''} className={`w-8 h-8 rounded-lg bg-[#121212] border border-white/10 ${idx === 3 ? 'rounded-full' : ''}`} title={item.name ?? ''} />
              ) : (
                <div key={`empty-${idx}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5"></div>
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
          <button onClick={() => setActiveTab('SCORE')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'SCORE' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>OP Score</button>
          <button onClick={() => setActiveTab('TEAM')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'TEAM' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Analyse d'équipe</button>
          <button onClick={() => setActiveTab('BUILD')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'BUILD' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Build</button>
          <button onClick={() => setActiveTab('OTHER')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'OTHER' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Autre</button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab !== 'NONE' && (
        <div className="bg-[#0e0e0e] border-t border-white/5 p-4 animate-fadeIn">
          {activeTab === 'SUMMARY' && <MatchSummary participants={match.participants} maxDamage={maxDamage} maxTaken={maxTaken} ranks={ranks} lang={lang} region={region} gameDurationSeconds={match.gameDuration} teams={match.teams} />}
          {activeTab === 'SCORE' && <MatchScore participants={match.participants} timelineData={match.timelineData || []} />}
          {activeTab === 'TEAM' && <MatchTeamAnalysis participants={match.participants} maxDamage={maxDamage} maxTaken={maxTaken} />}
          {activeTab === 'BUILD' && <MatchBuild match={match} />}
          {activeTab === 'OTHER' && <MatchOther me={me} participants={match.participants} />}
        </div>
      )}
    </div>
  );
};
