"use client";

import React, { useState } from 'react';
import { Match } from '../types';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { analyzeMatch } from '../services/geminiService';
import { MatchAnalysis } from './match/MatchAnalysis';
import { MatchGraph } from './match/MatchGraph';
import { MatchScoreboard } from './match/MatchScoreboard';
import { MatchDamageChart } from './match/MatchDamageChart';
import { useI18n } from "../app/LanguageContext";
import { PLACEHOLDER_SPELL } from '../constants';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  // ensure 'me' is always an object to avoid destructuring runtime errors
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
  
  const [activeTab, setActiveTab] = useState<'NONE' | 'ANALYSE' | 'GRAPH' | 'BUILD' | 'STATS'>('NONE');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { t, lang } = useI18n();

  const handleAiAnalysis = async () => {
    if (analysis) return; 
    setLoading(true);
    try {
        const result = await analyzeMatch(match);
        setAnalysis(result);
    } catch (error) {
        setAnalysis("Une erreur est survenue lors de l'analyse.");
    } finally {
        setLoading(false);
    }
  };

  const toggleTab = (tab: any) => {
      if (activeTab === tab) setActiveTab('NONE');
      else {
          setActiveTab(tab);
          if (tab === 'ANALYSE') handleAiAnalysis();
      }
  };

  const maxDamage = Math.max(...(Array.isArray(match.participants) ? match.participants.map((p: any) => Number(p.totalDamageDealtToChampions ?? 0)) : [0]));
  const winningTeamParticipants = Array.isArray(match.participants) ? match.participants.filter((p: any) => p.win) : [];
  const losingTeamParticipants = Array.isArray(match.participants) ? match.participants.filter((p: any) => !p.win) : [];
  // Safe opScore comparison with tie-breaker on damage then kills
  const safeCompare = (a: any, b: any) => {
    const ascore = Number(a?.opScore ?? 0);
    const bscore = Number(b?.opScore ?? 0);
    if (ascore !== bscore) return ascore > bscore ? a : b;
    // tie-breaker
    const aDmg = Number(a?.totalDamageDealtToChampions ?? 0);
    const bDmg = Number(b?.totalDamageDealtToChampions ?? 0);
    if (aDmg !== bDmg) return aDmg > bDmg ? a : b;
    // final tie-breaker: kills
    const aKills = Number(a?.kills ?? 0);
    const bKills = Number(b?.kills ?? 0);
    return aKills >= bKills ? a : b;
  };
  const mvpLocal = winningTeamParticipants.length ? winningTeamParticipants.reduce((prev: any, current: any) => safeCompare(prev, current)) : null;
  const aceLocal = losingTeamParticipants.length ? losingTeamParticipants.reduce((prev: any, current: any) => safeCompare(prev, current)) : null;
  // compute per-team best opscore for portrait opponent-MVP detection
  const teamBestOpScore: Record<number, number> = {};
  [100, 200].forEach((teamId) => {
    const team = Array.isArray(match.participants) ? match.participants.filter((p: any) => p.teamId === teamId) : [];
    const best = team.reduce((acc: number, p: any) => Math.max(acc, Number(p.opScore ?? 0)), 0);
    teamBestOpScore[teamId] = best;
  });

  // Determine overall MVP based on goldEarned (user requested MVP = gold)
  const overallMvp = Array.isArray(match.participants) && match.participants.length ? match.participants.reduce((best: any, p: any) => (Number(p.goldEarned ?? 0) > Number(best.goldEarned ?? 0) ? p : best), match.participants[0]) : null;
  const teamBestMap: Record<number, any> = {};
  [100, 200].forEach((teamId) => {
    const team = Array.isArray(match.participants) ? match.participants.filter((p: any) => p.teamId === teamId) : [];
    if (team.length === 0) return;
    const best = team.reduce((prev: any, cur: any) => (Number(cur.goldEarned ?? 0) > Number(prev.goldEarned ?? 0) ? cur : prev), team[0]);
    teamBestMap[teamId] = best;
  });

  // Safe accessor helpers
  const champImg = me?.champion?.imageUrl ?? null;
  const champName = me?.champion?.name ?? 'Unknown';
  const spells = Array.isArray(me?.spells) ? me.spells : ([] as any[]);
  // Filter out ward items from main items list so ward is shown only in the circle
  const allItems = Array.isArray(me?.items) ? me.items : ([] as any[]);
  const isWardItemLocal = (item: any) => {
    if (!item) return false;
    const name = (String(item.name ?? '')).toLowerCase();
    const tags = Array.isArray(item.tags) ? item.tags.map((t: string) => String(t)) : [];
    // Exclude Control Ward from circle (keep as inventory item) but show Oracle Lens as ward
    if (/control/i.test(name)) return false;
    // If DataDragon marks it as a Ward and name doesn't include 'control', treat as ward-in-circle
    if (tags.includes('Ward')) return true;
    // If it's a trinket and name suggests ward/trinket (Totem, Farsight, Stealth, Sight, Oracle), treat as ward-in-circle
    if (tags.includes('Trinket') && /ward|totem|farsight|sight|stealth|oracle/.test(name)) return true;
    return false;
  };

  // helper to parse timestamps like '12m 5s' or '3m'
  const parseTs = (s: string) => {
    if (!s) return 0;
    const m = String(s).match(/(\d+)m\s*(\d+)?s?/);
    if (!m) return 0;
    const mm = Number(m[1] || 0);
    const ss = Number(m[2] || 0);
    return mm * 60 + ss;
  };

  // Build a local inventory copy and consume ward items that were purchased in the timeline (ITEM_PURCHASED)
  const inventoryFromEvents = Array.isArray(match.itemBuild) ? match.itemBuild
    // normalize timestamp order: ensure chronological
    .slice().sort((a: any, b: any) => parseTs(a.timestamp || '') - parseTs(b.timestamp || '')) : [];

  // clone inventory so we can remove one ward occurrence if purchased
  const inventoryClone = [...allItems];
  const removeOneById = (arr: any[], id: any) => {
    const idx = arr.findIndex(it => Number(it?.id) === Number(id));
    if (idx >= 0) arr.splice(idx, 1);
  };
  if (Array.isArray(inventoryFromEvents) && inventoryFromEvents.length > 0) {
     for (const ev of inventoryFromEvents) {
       try {
         if (!ev || !ev.item) continue;
         const action = ev.action || '';
         const itemId = Number(ev.item.id);
         // If it was a purchase, consume one item from inventoryClone
         if (action === 'ITEM_PURCHASED') {
           // But only consume if the item is a placed ward (stealth/farsight) — control wards should not be consumed in circle representation
           const name = (ev.item.name || '').toLowerCase();
          if (/control/i.test(name)) {
            // leave Control Ward as inventory-only
          } else if (/farsight/i.test(name) || /stealth/i.test(name) || /oracle/.test(name) || (Array.isArray(ev.item.tags) && (ev.item.tags as any).includes('Ward'))) {
            // remove one occurrence for wards and oracle
            removeOneById(inventoryClone, itemId);
          } else {
            // For normal items purchased, remove them as well to keep inventory accurate
            removeOneById(inventoryClone, itemId);
          }
         }
         if (action === 'ITEM_SOLD') {
           // When sold, re-add the item to inventoryClone (best-effort: push at end)
           inventoryClone.push(ev.item);
         }
       } catch (e) {
         // ignore parsing errors
       }
     }
   }

  const items = inventoryClone.filter((it: any) => !isWardItemLocal(it));
  const wardItem = inventoryClone.find((it: any) => isWardItemLocal(it)) || null;

  // Ensure display name includes tag (Hera#ahri)
  const displaySummoner = me?.summonerName ? (me.summonerName + (me.tagLine ? `#${me.tagLine}` : '')) : (me?.summonerName ?? 'Unranked');

  const containerClass = 'mb-4 relative rounded-[1.5rem] overflow-hidden border transition-all duration-300 ' + (isWin ? 'border-lol-win/20 bg-[#0c1a15]/80 hover:bg-[#0c1a15]' : 'border-lol-loss/20 bg-[#1a0a0a]/80 hover:bg-[#1a0a0a]');
  
  // Render function for Build tab to avoid nested ternaries in JSX
  const renderBuildContent = () => {
    if (Array.isArray(match.itemBuild) && match.itemBuild.length > 0) {
      const sorted = [...match.itemBuild].slice().sort((a: any, b: any) => parseTs(a.timestamp || '') - parseTs(b.timestamp || ''));
      return sorted.map((step: any, idx: number) => (
        <div key={idx} className="flex items-center">
          <div className="flex flex-col items-center gap-2 group">
            <div className="relative">
              {step?.item?.imageUrl ? (
                <img src={step.item.imageUrl} className="w-10 h-10 rounded-lg border border-gray-700 group-hover:border-lol-gold transition-colors" title={step.item.name} alt={step.item.name} />
              ) : (
                <div className="w-10 h-10 rounded-lg border border-gray-700 bg-white/5 flex items-center justify-center text-xs font-bold text-gray-300">{(step?.item?.name && typeof step.item.name === 'string') ? step.item.name.charAt(0) : '?'}</div>
              )}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-[9px] px-1.5 rounded border border-white/10 whitespace-nowrap">{step.timestamp ?? '-'}</div>
              {step.action && (
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] px-1 rounded border ${step.action === 'ITEM_SOLD' ? 'bg-red-700/60 border-red-400/40 text-white' : step.action === 'ITEM_PURCHASED' ? 'bg-green-700/40 border-green-400/40 text-white' : 'bg-gray-800/40 border-white/10 text-gray-200'}`}>
                  {String(step.action).replace('ITEM_', '')}
                </div>
              )}
            </div>
          </div>
          {idx < sorted.length - 1 && (
            <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
          )}
        </div>
      ));
    }

    if (Array.isArray(items) && items.length > 0) {
      return items.map((it: any, idx: number) => {
        let label = 'Held';
        if (Array.isArray(match.itemBuild) && match.itemBuild.length > 0) {
          const last = [...match.itemBuild].reverse().find((s: any) => s.item && Number(s.item.id) === Number(it.id) && s.action === 'ITEM_PURCHASED');
          if (last) label = last.timestamp || 'Held';
        }
        return (
          <div key={`fallback-${idx}`} className="flex items-center">
            <div className="flex flex-col items-center gap-2 group">
              <div className="relative">
                {it?.imageUrl ? (
                  <img src={it.imageUrl} className="w-10 h-10 rounded-lg border border-gray-700" title={it.name} alt={it.name} />
                ) : (
                  <div className="w-10 h-10 rounded-lg border border-gray-700 bg-white/5 flex items-center justify-center text-xs font-bold text-gray-300">{(it?.name && typeof it.name === 'string') ? it.name.charAt(0) : '?'}</div>
                )}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-[9px] px-1.5 rounded border border-white/10 whitespace-nowrap">{label}</div>
              </div>
            </div>
            {idx < (items.length - 1) && (
              <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
            )}
          </div>
        );
      });
    }

    return <div className="text-sm text-gray-400">Aucun build disponible pour ce match.</div>;
  };


  
  return (
    <div className={containerClass}>
      {/* Main Card Content */}
      <div className="p-4 pl-6 flex flex-col md:flex-row gap-6 items-center relative z-10">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWin ? 'bg-lol-win' : 'bg-lol-loss'}`}></div>

        {/* Game Info */}
        <div className="w-full md:w-28 flex flex-col gap-1">
          <span className={`font-black font-display uppercase tracking-wider text-[10px] ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
            {match.gameMode === 'Ranked Solo/Duo' ? 'Ranked Solo' : match.gameMode === 'Ranked Flex' ? 'Ranked Flex' : 'Normal'}
          </span>
          <span className="text-[10px] text-gray-500 font-bold">10 hours ago</span>
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
            {/* Portrait badges: overall MVP (gold) or team-best (grey) */}
            {overallMvp && me && overallMvp.summonerName === me.summonerName ? (
                <div className="absolute -top-3 -left-2 bg-gradient-to-br from-yellow-300 to-yellow-600 text-[9px] px-1.5 py-0.5 rounded text-black font-black border border-white shadow-lg z-20">MVP</div>
            ) : (teamBestMap[me?.teamId] && teamBestMap[me.teamId].summonerName === me.summonerName) ? (
                <div className="absolute -top-3 -left-2 bg-gray-500/10 text-gray-300 border border-gray-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold z-20">MVP</div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            {spells.map((spell: any, idx: number) => (
              <img key={spell.id ?? spell ?? idx} src={spell.imageUrl ?? PLACEHOLDER_SPELL} alt={spell.name ?? ''} className="w-6 h-6 rounded-md border border-white/10 bg-[#121212]" />
            ))}
          </div>
          <div className="flex flex-col gap-1">
             <div className="w-6 h-6 rounded-full bg-black border border-lol-gold/50 flex items-center justify-center text-[10px] font-bold text-lol-gold">R</div>
             <div className="w-6 h-6 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">S</div>
          </div>
        </div>

        {/* KDA Stats */}
        <div className="flex flex-col items-center w-32">
          <div className="text-xl font-display font-black text-white tracking-widest">
            {kills} <span className="text-gray-600 text-sm">/</span> <span className="text-lol-red">{deaths}</span> <span className="text-gray-600 text-sm">/</span> {assists}
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{kda} KDA</div>
          <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">P/Kill 42%</div>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {items.map((item: any) => (
             item?.imageUrl ? <img key={item.id ?? JSON.stringify(item)} src={item.imageUrl} alt={item.name ?? ''} className="w-8 h-8 rounded-lg bg-[#121212] border border-white/10" title={item.name ?? ''} /> : <div key={JSON.stringify(item)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5"></div>
          ))}
          {[...Array(Math.max(0, 6 - (items?.length ?? 0)))].map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5"></div>
          ))}
          {/* Ward indicator: show specific ward in circle if present */}
          <div className="ml-2">
            {wardItem ? (
              <div className="w-8 h-8 rounded-full bg-black border border-gray-700 flex items-center justify-center" title={wardItem.name || 'Ward'}>
                {wardItem.imageUrl ? <img src={wardItem.imageUrl} alt={wardItem.name} className="w-5 h-5" /> : <span className="text-xs">W</span>}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30"></div>
            )}
          </div>
        </div>

        {/* Stats Extra - Desktop */}
        <div className="hidden md:flex flex-col text-xs text-gray-400 border-l border-white/5 pl-4 gap-1 min-w-[100px]">
           <div className="flex justify-between w-full"><span>CS</span> <span className="text-gray-200 font-bold">{me.cs ?? 0} ({ csPerMinHeader }/m)</span></div>
           <div className="flex justify-between w-full"><span>Vision</span> <span className="text-gray-200 font-bold">{me.visionScore ?? 0}</span></div>
           <div className="text-[10px] text-gray-600 font-bold">{displaySummoner}</div>
        </div>
        
        {/* Toggle Button */}
        <div className="flex-grow flex justify-end">
           <button 
             onClick={() => toggleTab(activeTab === 'NONE' ? 'ANALYSE' : 'NONE')}
             className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 ${activeTab !== 'NONE' ? 'bg-white/10 rotate-180 border-white/30 text-white' : 'text-gray-500'}`}
           >
              <ChevronDown className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Tabs Actions */}
      <div className="flex border-t border-white/5 bg-[#121212]">
          <button onClick={() => toggleTab('ANALYSE')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'ANALYSE' ? 'text-lol-hextech border-lol-hextech bg-lol-hextech/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>{t.analysis}</button>
          <button onClick={() => toggleTab('GRAPH')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'GRAPH' ? 'text-lol-gold border-lol-gold bg-lol-gold/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>{t.aiGraph}</button>
          <button onClick={() => toggleTab('STATS')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'STATS' ? 'text-lol-gold border-lol-gold bg-lol-gold/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>{t.stats}</button>
          <button onClick={() => toggleTab('BUILD')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'BUILD' ? 'text-lol-gold border-lol-gold bg-lol-gold/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>{t.build}</button>
      </div>

      {/* Tab Content */}
      {activeTab !== 'NONE' && (
        <div className="bg-[#0e0e0e] border-t border-white/5 p-4 animate-fadeIn">
            {activeTab === 'ANALYSE' && <MatchAnalysis analysis={analysis} loading={loading} lang={lang} />}
            {activeTab === 'GRAPH' && match.timelineData && <MatchGraph data={match.timelineData} />}
            {activeTab === 'STATS' && <MatchDamageChart participants={match.participants} lang={lang} />}
            {activeTab === 'BUILD' && (
               <div className="bg-[#121212] p-6 rounded-xl border border-white/5 overflow-x-auto mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Item Build Path</h4>
                  <div className="flex items-center min-w-max pb-4">
                    {/* Rendered build content (either timeline or fallback) */}
                    {renderBuildContent()}
                   </div>
                </div>
             )}
            
            {/* Scoreboard is always shown below detailed tabs if any tab is open */}
            <MatchScoreboard participants={match.participants} maxDamage={maxDamage} mvpId={overallMvp?.summonerName ?? ''} aceId={aceLocal?.summonerName ?? ''} lang={lang} gameDurationSeconds={match.gameDuration} />
        </div>
      )}
    </div>
  );
};
