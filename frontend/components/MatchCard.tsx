
import React, { useState } from 'react';
import { Match, Participant, Language } from '../types';
import { Clock, Eye, Sparkles, Sword, ChevronDown, ChevronUp, Swords, ArrowRight, Award } from 'lucide-react';
import { analyzeMatch } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MatchCardProps {
  match: Match;
  lang?: Language;
}

type TabType = 'NONE' | 'ANALYSE' | 'GRAPH' | 'BUILD';

export const MatchCard: React.FC<MatchCardProps> = ({ match, lang = 'FR' }) => {
  const { me } = match;
  const isWin = me.win;
  const kda = ((me.kills + me.assists) / Math.max(1, me.deaths)).toFixed(2);
  const durationMin = Math.floor(match.gameDuration / 60);
  const durationSec = match.gameDuration % 60;
  
  const [activeTab, setActiveTab] = useState<TabType>('NONE');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleAiAnalysis = async () => {
    if (analysis) return; // Already analyzed
    setLoading(true);
    const result = await analyzeMatch(match);
    setAnalysis(result);
    setLoading(false);
  };

  const toggleTab = (tab: TabType) => {
      if (activeTab === tab) setActiveTab('NONE');
      else {
          setActiveTab(tab);
          if (tab === 'ANALYSE') handleAiAnalysis();
      }
  };

  const maxDamage = Math.max(...match.participants.map(p => p.totalDamageDealtToChampions));

  // Determine MVPs
  const winningTeamParticipants = match.participants.filter(p => p.win);
  const losingTeamParticipants = match.participants.filter(p => !p.win);
  
  // MVP is highest score in winning team
  const mvp = winningTeamParticipants.reduce((prev, current) => (prev.opScore! > current.opScore!) ? prev : current);
  
  // ACE is highest score in losing team
  const ace = losingTeamParticipants.reduce((prev, current) => (prev.opScore! > current.opScore!) ? prev : current);

  return (
    <div className={`mb-4 relative rounded-[1.5rem] overflow-hidden border transition-all duration-300 ${
      isWin 
        ? 'border-lol-win/20 bg-[#0c1a15]' // Darker background for win
        : 'border-lol-loss/20 bg-[#1a0a0a]' // Darker background for loss
    }`}>
      {/* Main Card Content */}
      <div className="p-4 pl-6 flex flex-col md:flex-row gap-6 items-center relative z-10">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWin ? 'bg-lol-win' : 'bg-lol-loss'}`}></div>

        {/* Game Info */}
        <div className="w-full md:w-28 flex flex-col gap-1">
          <span className={`font-black font-display uppercase tracking-wider text-xs ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
            {match.gameMode === 'Ranked Solo/Duo' ? 'Ranked Solo' : match.gameMode === 'Ranked Flex' ? 'Ranked Flex' : 'Normal'}
          </span>
          <span className="text-[10px] text-gray-500 font-bold">10 hours ago</span>
          <span className={`font-black text-xl tracking-tight ${isWin ? 'text-white' : 'text-gray-500'}`}>{isWin ? t.win : t.loss}</span>
          <span className="text-xs text-gray-500 font-mono">{durationMin}m {durationSec}s</span>
        </div>

        {/* Champion & Spells */}
        <div className="flex gap-3 items-center">
          <div className="relative">
            <img 
              src={me.champion.imageUrl} 
              alt={me.champion.name} 
              className={`w-14 h-14 rounded-2xl border-2 ${isWin ? 'border-lol-win' : 'border-lol-loss'} object-cover`} 
            />
            <div className="absolute -bottom-2 -right-2 bg-[#121212] text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-gray-700 text-white font-bold shadow-md z-10">
              {me.level}
            </div>
            {/* MVP Badge for self if applicable */}
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
             {/* Mock Runes */}
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

        {/* Stats Extra */}
        <div className="hidden md:flex flex-col text-xs text-gray-400 border-l border-white/5 pl-4 gap-1">
           <div className="text-lol-red font-bold">P/Kill 42%</div>
           <div>Control Ward 2</div>
           <div>CS {me.cs} ({ (me.cs/durationMin).toFixed(1) })</div>
           <div className="font-bold text-white">{me.rank || "Unranked"}</div>
        </div>
        
        {/* Toggle Button */}
        <div className="flex-grow flex justify-end">
           <button 
             onClick={() => toggleTab(activeTab === 'NONE' ? 'ANALYSE' : 'NONE')}
             className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors ${activeTab !== 'NONE' ? 'bg-white/10 rotate-180' : ''}`}
           >
              <ChevronDown className="w-4 h-4 text-gray-400" />
           </button>
        </div>
      </div>

      {/* Expandable Tabs Actions */}
      <div className="flex border-t border-white/5 bg-[#121212]">
          <button 
            onClick={() => toggleTab('ANALYSE')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'ANALYSE' ? 'text-lol-hextech border-lol-hextech bg-lol-hextech/5' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t.analysis}
          </button>
          <button 
            onClick={() => toggleTab('GRAPH')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'GRAPH' ? 'text-lol-gold border-lol-gold bg-lol-gold/5' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t.aiGraph}
          </button>
          <button 
            onClick={() => toggleTab('BUILD')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'BUILD' ? 'text-lol-gold border-lol-gold bg-lol-gold/5' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {t.build}
          </button>
      </div>

      {/* Tab Content */}
      {activeTab !== 'NONE' && (
        <div className="bg-[#0e0e0e] border-t border-white/5 p-4 animate-fadeIn">
            
            {/* ANALYSIS TAB */}
            {activeTab === 'ANALYSE' && (
                <div className="mb-6">
                    {loading ? (
                        <div className="flex items-center gap-2 text-lol-hextech text-sm font-bold animate-pulse">
                            <Sparkles className="w-4 h-4" /> {t.loading}
                        </div>
                    ) : (
                        <div className="bg-[#18181b] p-4 rounded-xl border border-lol-hextech/30 text-sm text-gray-300 font-light leading-relaxed">
                             <h4 className="text-lol-hextech font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Gemini Coach
                             </h4>
                             <div dangerouslySetInnerHTML={{ __html: analysis?.replace(/\n/g, '<br/>') || '' }} />
                        </div>
                    )}
                </div>
            )}

            {/* GRAPH TAB */}
            {activeTab === 'GRAPH' && match.timelineData && (
                <div className="h-64 w-full bg-[#121212] p-4 rounded-xl border border-white/5">
                   <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-xs font-bold text-gray-500">Team Avg AI-Score</span>
                      <div className="flex gap-4">
                         <span className="text-[10px] text-indigo-400 font-bold">Blue Team</span>
                         <span className="text-[10px] text-red-400 font-bold">Red Team</span>
                      </div>
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={match.timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="#555" tick={{fontSize: 10}} />
                        <YAxis stroke="#555" domain={[30, 70]} hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                          labelStyle={{ color: '#888' }}
                        />
                        <ReferenceLine y={50} stroke="#444" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="blueScore" stroke="#818cf8" strokeWidth={2} dot={{r:0}} activeDot={{r:4}} />
                        <Line type="monotone" dataKey="redScore" stroke="#f87171" strokeWidth={2} dot={{r:0}} activeDot={{r:4}} />
                     </LineChart>
                   </ResponsiveContainer>
                   {/* Objectives Legend Mockup */}
                   <div className="flex justify-center gap-6 mt-2 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Baron</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Drake</span>
                   </div>
                </div>
            )}

            {/* BUILD TAB */}
            {activeTab === 'BUILD' && match.itemBuild && (
               <div className="bg-[#121212] p-6 rounded-xl border border-white/5 overflow-x-auto">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Item Build Path</h4>
                  <div className="flex items-center min-w-max pb-4">
                     {match.itemBuild.map((step, idx) => (
                        <div key={idx} className="flex items-center">
                           <div className="flex flex-col items-center gap-2 group">
                              <img 
                                src={step.item.imageUrl} 
                                className="w-10 h-10 rounded-lg border border-gray-700 group-hover:border-lol-gold transition-colors" 
                                title={step.item.name}
                              />
                              <span className="text-[10px] font-bold text-gray-400 font-mono">{step.timestamp}</span>
                           </div>
                           {idx < match.itemBuild!.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* SCOREBOARD (Shown in all tabs for now or specific ones) */}
            <div className="flex flex-col gap-1 mt-6">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1">
                    <div className="col-span-3">{t.score}</div>
                    <div className="col-span-2 text-center">KDA</div>
                    <div className="col-span-2 text-center">{t.damage}</div>
                    <div className="col-span-2 text-center">CS</div>
                    <div className="col-span-3 text-right">Items</div>
                </div>

                {/* Team 1 (Blue) */}
                <TeamSection 
                    teamName={t.teamBlue} 
                    participants={match.participants.filter(p => p.teamId === 100)} 
                    maxDamage={maxDamage}
                    isWin={match.participants.find(p => p.teamId === 100)?.win || false}
                    mvpId={mvp.summonerName}
                    aceId={ace.summonerName}
                />

                 {/* Divider */}
                <div className="h-px bg-white/5 my-2"></div>

                {/* Team 2 (Red) */}
                <TeamSection 
                    teamName={t.teamRed} 
                    participants={match.participants.filter(p => p.teamId === 200)} 
                    maxDamage={maxDamage}
                    isWin={match.participants.find(p => p.teamId === 200)?.win || false}
                    mvpId={mvp.summonerName}
                    aceId={ace.summonerName}
                />
            </div>
        </div>
      )}
    </div>
  );
};

const TeamSection = ({ teamName, participants, maxDamage, isWin, mvpId, aceId }: { teamName: string, participants: Participant[], maxDamage: number, isWin: boolean, mvpId: string, aceId: string }) => (
    <div className="flex flex-col gap-1">
        <div className={`text-xs font-bold px-2 mb-1 ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
            {isWin ? 'Win' : 'Lose'} ({teamName})
        </div>
        {participants.map((p, i) => {
            const isMvp = p.summonerName === mvpId;
            const isAce = p.summonerName === aceId;

            return (
            <div key={i} className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg hover:bg-white/5 transition-colors ${p.summonerName === 'Faker' ? 'bg-white/5 border border-white/5' : ''}`}>
                
                {/* Champ & Name */}
                <div className="col-span-3 flex items-center gap-2 overflow-hidden">
                    <div className="relative">
                        <img src={p.champion.imageUrl} className="w-8 h-8 rounded-lg border border-gray-700" />
                        <div className="absolute -bottom-1 -right-1 bg-black text-[8px] w-3 h-3 flex items-center justify-center rounded text-gray-400 border border-gray-800">{p.level}</div>
                    </div>
                    <div className="flex flex-col min-w-0">
                         <span className={`text-xs font-bold truncate ${p.summonerName === 'Faker' ? 'text-white' : 'text-gray-400'}`}>
                            {p.summonerName}
                         </span>
                         <span className="text-[9px] text-gray-600">{p.rank || "P4"}</span>
                    </div>
                </div>

                {/* KDA & Badge */}
                <div className="col-span-2 flex flex-col items-center justify-center relative">
                    <div className="text-xs text-gray-300 font-bold">{p.kills}/{p.deaths}/{p.assists}</div>
                    <div className="text-[9px] text-gray-500">{((p.kills + p.assists)/Math.max(1, p.deaths)).toFixed(2)}:1</div>
                    {isMvp && (
                         <div className="absolute -right-2 top-0 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-[8px] px-1 rounded font-bold">MVP</div>
                    )}
                    {isAce && (
                         <div className="absolute -right-2 top-0 bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[8px] px-1 rounded font-bold">ACE</div>
                    )}
                </div>

                {/* Damage Bar */}
                <div className="col-span-2 flex flex-col justify-center gap-1">
                    <div className="text-[10px] text-center text-gray-400">{p.totalDamageDealtToChampions.toLocaleString()}</div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div style={{ width: `${(p.totalDamageDealtToChampions / maxDamage) * 100}%` }} className="h-full bg-lol-red"></div>
                    </div>
                </div>

                {/* CS */}
                <div className="col-span-2 text-center flex flex-col justify-center">
                    <div className="text-xs text-gray-300">{p.cs}</div>
                    <div className="text-[9px] text-gray-500">6.2/m</div>
                </div>

                {/* Items */}
                <div className="col-span-3 flex justify-end gap-0.5">
                    {p.items.map((item, idx) => (
                        <img key={idx} src={item.imageUrl} className="w-6 h-6 rounded bg-[#121212] border border-white/10" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 ml-1"></div>
                </div>

            </div>
            );
        })}
    </div>
);
