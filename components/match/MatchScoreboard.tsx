
import React from 'react';
import { Participant } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface MatchScoreboardProps {
  participants: Participant[];
  maxDamage: number;
  mvpId: string;
  aceId: string;
  lang: string;
}

export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ participants, maxDamage, mvpId, aceId, lang }) => {
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  const TeamSection = ({ teamId, teamName, isWin }: { teamId: number, teamName: string, isWin: boolean }) => {
    const teamParticipants = participants.filter(p => p.teamId === teamId);
    
    return (
        <div className="flex flex-col gap-1">
            <div className={`text-xs font-bold px-2 mb-2 flex justify-between items-center ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
                <span>{isWin ? 'VICTORY' : 'DEFEAT'}</span>
                <span className="text-gray-600 text-[10px] uppercase">{teamName}</span>
            </div>
            {teamParticipants.map((p, i) => {
                const isMvp = p.summonerName === mvpId;
                const isAce = p.summonerName === aceId;

                return (
                <div key={i} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors ${p.summonerName === 'Faker' ? 'bg-lol-gold/5 border border-lol-gold/20' : ''}`}>
                    
                    {/* Champ & Name */}
                    <div className="col-span-4 lg:col-span-3 flex items-center gap-3 overflow-hidden">
                        <div className="relative">
                            <img src={p.champion.imageUrl} className="w-8 h-8 rounded-lg border border-gray-700" alt={p.champion.name} />
                            <div className="absolute -bottom-1 -right-1 bg-black text-[8px] w-4 h-4 flex items-center justify-center rounded text-gray-400 border border-gray-800">{p.level}</div>
                        </div>
                        <div className="flex flex-col min-w-0">
                             <span className={`text-xs font-bold truncate ${p.summonerName === 'Faker' ? 'text-lol-gold' : 'text-gray-300'}`}>
                                {p.summonerName}
                             </span>
                             <span className="text-[9px] text-gray-600">{p.rank || "Unranked"}</span>
                        </div>
                    </div>

                    {/* KDA & Badge */}
                    <div className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center relative">
                        <div className="text-xs text-gray-200 font-bold tracking-wider">{p.kills}/{p.deaths}/{p.assists}</div>
                        <div className="text-[9px] text-gray-500 font-mono">{((p.kills + p.assists)/Math.max(1, p.deaths)).toFixed(2)}:1</div>
                        {isMvp && (
                             <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-[8px] px-1 rounded font-bold">MVP</div>
                        )}
                        {isAce && (
                             <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[8px] px-1 rounded font-bold">ACE</div>
                        )}
                    </div>

                    {/* Damage Bar (Desktop) */}
                    <div className="hidden lg:flex col-span-2 flex-col justify-center gap-1 px-2">
                        <div className="text-[10px] text-center text-gray-400">{p.totalDamageDealtToChampions.toLocaleString()}</div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${(p.totalDamageDealtToChampions / maxDamage) * 100}%` }} className="h-full bg-lol-red"></div>
                        </div>
                    </div>

                    {/* CS */}
                    <div className="hidden lg:flex col-span-2 text-center flex-col justify-center">
                        <div className="text-xs text-gray-300">{p.cs}</div>
                        <div className="text-[9px] text-gray-500">6.2/m</div>
                    </div>

                    {/* Items */}
                    <div className="col-span-5 lg:col-span-3 flex justify-end gap-1">
                        {p.items.map((item, idx) => (
                            <img key={idx} src={item.imageUrl} className="w-6 h-6 rounded bg-[#121212] border border-white/10" alt={item.name} title={item.name} />
                        ))}
                        <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 ml-1"></div>
                    </div>

                </div>
                );
            })}
        </div>
    );
  };

  const team100Win = participants.find(p => p.teamId === 100)?.win || false;
  const team200Win = participants.find(p => p.teamId === 200)?.win || false;

  return (
    <div className="flex flex-col gap-6 mt-6">
        <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1 border-b border-white/5 pb-2">
            <div className="col-span-4 lg:col-span-3">Summoner</div>
            <div className="col-span-3 lg:col-span-2 text-center">KDA</div>
            <div className="hidden lg:block col-span-2 text-center">{t.damage}</div>
            <div className="hidden lg:block col-span-2 text-center">CS</div>
            <div className="col-span-5 lg:col-span-3 text-right">Items</div>
        </div>

        <TeamSection teamId={100} teamName={t.teamBlue} isWin={team100Win} />
        <div className="h-px bg-white/5"></div>
        <TeamSection teamId={200} teamName={t.teamRed} isWin={team200Win} />
    </div>
  );
};
