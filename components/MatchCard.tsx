import React, { useState } from 'react';
import { Match } from '../types';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { analyzeMatch } from '../services/geminiService';
import { MatchAnalysis } from './match/MatchAnalysis';
import { MatchGraph } from './match/MatchGraph';
import { MatchScoreboard } from './match/MatchScoreboard';
import { MatchDamageChart } from './match/MatchDamageChart';
import { useI18n } from "../app/LanguageContext";

interface MatchCardProps {
  match: Match;
}

type TabType = 'NONE' | 'ANALYSE' | 'GRAPH' | 'BUILD' | 'STATS';

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const { me } = match;
  const isWin = me.win;
  const kda = ((me.kills + me.assists) / Math.max(1, me.deaths)).toFixed(2);
  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = match.gameDuration % 60;
  
  const [activeTab, setActiveTab] = useState<TabType>('NONE');
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

  const toggleTab = (tab: TabType) => {
      if (activeTab === tab) setActiveTab('NONE');
      else {
          setActiveTab(tab);
          if (tab === 'ANALYSE') handleAiAnalysis();
      }
  };

  const maxDamage = Math.max(...match.participants.map(p => p.totalDamageDealtToChampions));
  const winningTeamParticipants = match.participants.filter(p => p.win);
  const losingTeamParticipants = match.participants.filter(p => !p.win);
  
  const mvp = winningTeamParticipants.reduce((prev, current) => (prev.opScore! > current.opScore!) ? prev : current);
  const ace = losingTeamParticipants.reduce((prev, current) => (prev.opScore! > current.opScore!) ? prev : current);

  return (
    <div className={`mb-4 relative rounded-[1.5rem] overflow-hidden border transition-all duration-300 ${
      isWin 
        ? 'border-lol-win/20 bg-[#0c1a15]/80 hover:bg-[#0c1a15]' 
        : 'border-lol-loss/20 bg-[#1a0a0a]/80 hover:bg-[#1a0a0a]'
    }`}>
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
            <img 
              src={me.champion.imageUrl} 
              alt={me.champion.name} 
              className={`w-14 h-14 rounded-2xl border-2 ${isWin ? 'border-lol-win' : 'border-lol-loss'} object-cover shadow-lg`} 
            />
            <div className="absolute -bottom-2 -right-2 bg-[#121212] text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-gray-700 text-white font-bold shadow-md z-10">
              {me.level}
            </div>
            {mvp.summonerName === me.summonerName && (
                <div className="absolute -top-3 -left-2 bg-gradient-to-br from-yellow-300 to-yellow-600 text-[9px] px-1.5 py-0.5 rounded text-black font-black border border-white shadow-lg z-20">MVP</div>
            )}
             {ace.summonerName === me.summonerName && (
                <div className="absolute -top-3 -left-2 bg-gradient-to-br from-purple-500 to-purple-800 text-[9px] px-1.5 py-0.5 rounded text-white font-black border border-white shadow-lg z-20">ACE</div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {me.spells.map(spell => (
              <img key={spell.id} src={spell.imageUrl} alt={spell.name} className="w-6 h-6 rounded-md border border-white/10 bg-[#121212]" />
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
            {me.kills} <span className="text-gray-600 text-sm">/</span> <span className="text-lol-red">{me.deaths}</span> <span className="text-gray-600 text-sm">/</span> {me.assists}
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{kda} KDA</div>
          <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">P/Kill 42%</div>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {me.items.map((item) => (
             <img key={item.id} src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-lg bg-[#121212] border border-white/10" title={item.name} />
          ))}
          {[...Array(Math.max(0, 6 - me.items.length))].map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5"></div>
          ))}
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 ml-2"></div> 
        </div>

        {/* Stats Extra - Desktop */}
        <div className="hidden md:flex flex-col text-xs text-gray-400 border-l border-white/5 pl-4 gap-1 min-w-[100px]">
           <div className="flex justify-between w-full"><span>CS</span> <span className="text-gray-200 font-bold">{me.cs} ({ (me.cs/durationMin).toFixed(1) })</span></div>
           <div className="flex justify-between w-full"><span>Vision</span> <span className="text-gray-200 font-bold">{me.visionScore}</span></div>
           <div className="font-bold text-white mt-1 px-2 py-0.5 bg-white/10 rounded text-center">{me.rank || "Unranked"}</div>
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
            {activeTab === 'BUILD' && match.itemBuild && (
               <div className="bg-[#121212] p-6 rounded-xl border border-white/5 overflow-x-auto mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Item Build Path</h4>
                  <div className="flex items-center min-w-max pb-4">
                     {match.itemBuild.map((step, idx) => (
                        <div key={idx} className="flex items-center">
                           <div className="flex flex-col items-center gap-2 group">
                              <div className="relative">
                                <img src={step.item.imageUrl} className="w-10 h-10 rounded-lg border border-gray-700 group-hover:border-lol-gold transition-colors" title={step.item.name} alt={step.item.name} />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-[9px] px-1.5 rounded border border-white/10 whitespace-nowrap">{step.timestamp}</div>
                              </div>
                           </div>
                           {idx < match.itemBuild!.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}
            
            {/* Scoreboard is always shown below detailed tabs if any tab is open */}
            <MatchScoreboard participants={match.participants} maxDamage={maxDamage} mvpId={mvp.summonerName} aceId={ace.summonerName} lang={lang} />
        </div>
      )}
    </div>
  );
};
