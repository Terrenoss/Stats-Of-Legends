import React from 'react';
import { SummonerProfile, Language } from '../types';
import { YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TRANSLATIONS, MOCK_ROLES, RANK_EMBLEMS, CURRENT_PATCH } from '../constants';
import { Clock } from 'lucide-react';

interface ProfileHeaderProps {
  profile: SummonerProfile;
  lang: Language;
  onUpdateRequest?: () => void;
  lpHistory?: any[];
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, lang, onUpdateRequest, lpHistory }) => {
  const t = TRANSLATIONS[lang];
  const history = lpHistory && lpHistory.length ? lpHistory : [];
  const safePastRanks = Array.isArray(profile.pastRanks) ? profile.pastRanks : [];
  const safeSolo = profile.ranks?.solo || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const safeFlex = profile.ranks?.flex || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const [now, setNow] = React.useState(() => Date.now());
  const hasLadder = typeof profile.ladderRank === 'number' && profile.ladderRank > 0 && typeof profile.topPercent === 'number' && profile.topPercent > 0;

  React.useEffect(() => {
    // Rafraîchit l’horloge locale pour que "il y a X secondes" se mette à jour sans reload
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const getLastUpdatedText = () => {
      const diffMs = now - profile.lastUpdated;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      const format = (fr: string, en: string, es: string, kr: string) => {
        if (lang === 'FR') return fr;
        if (lang === 'EN') return en;
        if (lang === 'ES') return es;
        if (lang === 'KR') return kr;
        return en;
      };

      if (diffSec < 60) {
        return format(
          `il y a ${diffSec} secondes`,
          `${diffSec} seconds ago`,
          `hace ${diffSec} segundos`,
          `${diffSec}초 전`
        );
      }
      if (diffMin < 60) {
        return format(
          `il y a ${diffMin} minutes`,
          `${diffMin} minutes ago`,
          `hace ${diffMin} minutos`,
          `${diffMin}분 전`
        );
      }
      if (diffHours < 24) {
        return format(
          `il y a ${diffHours} heures`,
          `${diffHours} hours ago`,
          `hace ${diffHours} horas`,
          `${diffHours}시간 전`
        );
      }
      return format(
        `il y a ${diffDays} jours`,
        `${diffDays} days ago`,
        `hace ${diffDays} días`,
        `${diffDays}일 전`
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      
      {/* 1. Identity & Past Ranks (Col 4) */}
      <div className="lg:col-span-4 bg-[#121212] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl flex flex-col">
        <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-[1.5rem] bg-[#121212] p-1 border border-lol-gold/50 shadow-glow-gold relative z-10">
                  <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/${CURRENT_PATCH}/img/profileicon/${profile.profileIconId}.png`} 
                      alt="Icon" 
                      className="w-full h-full object-cover rounded-[1.2rem]"
                  />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#050505] text-lol-gold text-[10px] px-3 py-0.5 rounded-full border border-lol-gold font-bold font-mono z-20 whitespace-nowrap">
                  Lvl {profile.level}
              </div>
            </div>

            <div className="flex flex-col pt-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="text-3xl font-bold text-white tracking-tight font-display uppercase leading-none">
                    {profile.name}
                  </h2>
                  <span className="text-gray-500 text-sm font-sans font-medium">#{profile.tag}</span>
                </div>
                <button
                  className="mt-1 w-max px-6 py-1.5 bg-lol-red/10 hover:bg-lol-red text-lol-red hover:text-white text-[10px] font-bold uppercase tracking-wider border border-lol-red/20 rounded-full transition-all"
                  onClick={onUpdateRequest}
                >
                    {t.update}
                </button>
                <div className="mt-2 text-[10px] text-gray-500 font-medium flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {t.lastUpdated}: <span className="text-gray-300">{getLastUpdatedText()}</span>
                </div>
            </div>
        </div>

        {/* Past Ranks */}
        <div className="mt-auto border-t border-white/5 pt-4">
            <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-2 tracking-widest">{t.pastRanks}</h4>
            <div className="flex flex-wrap gap-2">
                {safePastRanks.length === 0 ? (
                  <div className="text-gray-400 text-sm font-medium">{t.noPastRanks}</div>
                ) : (
                  safePastRanks.map((rank, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold">{rank.season}:</span>
                        <span className="text-[10px] text-gray-200 font-bold">{rank.tier} {rank.rank}</span>
                    </div>
                  ))
                )}
            </div>
        </div>
      </div>

      {/* 2. Current Ranks (Col 4) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
         {/* Solo Duo */}
         <div className="flex-1 bg-[#121212] border border-white/5 rounded-[1.5rem] p-5 flex items-center gap-5 relative overflow-hidden group">
             <div className="w-20 h-20 bg-black/30 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner p-2">
                {typeof safeSolo.tier === 'string' && RANK_EMBLEMS[safeSolo.tier] ? (
                  <img src={RANK_EMBLEMS[safeSolo.tier]} className="w-full h-full object-contain drop-shadow-lg" alt={safeSolo.tier} />
                ) : typeof safeSolo.tier === 'string' ? (
                  <span className="font-display text-4xl font-black text-lol-gold drop-shadow-md">{safeSolo.tier.charAt(0)}</span>
                ) : (
                  <span className="font-display text-4xl font-black text-lol-gold drop-shadow-md">U</span>
                )}
             </div>
             <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{t.rankSolo}</div>
                <div className="text-white font-bold font-display text-2xl tracking-wide">{safeSolo.tier ?? 'Unranked'} {safeSolo.rank ?? ''}</div>
                <div className="text-lol-gold text-sm font-mono font-bold mt-0.5">{safeSolo.lp ?? '-'} LP</div>
                <div className="text-[10px] text-gray-400 mt-1">{safeSolo.wins ?? '-'}W {safeSolo.losses ?? '-'}L</div>
                
                {/* Ladder Rank */}
                {hasLadder && (
                  <div className="mt-2 text-xs text-gray-500 font-medium">
                    {t.ladderRank}{' '}
                    <span className="text-white font-bold">{profile.ladderRank.toLocaleString()}</span>{' '}
                    ({profile.topPercent}% {t.topPercent})
                  </div>
                )}
             </div>
         </div>

         {/* Flex */}
         <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
             <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center border border-white/5 p-1">
                {typeof safeFlex.tier === 'string' && RANK_EMBLEMS[safeFlex.tier] ? (
                   <img src={RANK_EMBLEMS[safeFlex.tier]} className="w-full h-full object-contain grayscale opacity-80" alt={safeFlex.tier} />
                ) : typeof safeFlex.tier === 'string' ? (
                   <span className="font-display text-xl font-black text-gray-400">{safeFlex.tier.charAt(0)}</span>
                ) : (
                   <span className="font-display text-xl font-black text-gray-400">U</span>
                )}
             </div>
             <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Flex</div>
                <div className="text-gray-300 font-bold font-display text-sm tracking-wide">{safeFlex.tier ?? 'Unranked'} {safeFlex.rank ?? ''} • {safeFlex.lp ?? '-'} LP</div>
             </div>
         </div>
      </div>

      {/* 3. Stats Summary (LP Graph & Roles) (Col 4) */}
      <div className="lg:col-span-4 grid grid-rows-2 gap-4">
         {/* LP Graph */}
         <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4 flex flex-col relative shadow-xl">
             <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t.lpHistory}</h3>
             <div className="flex-1 min-h-[80px]">
                {history.length === 0 ? (
                  <div className="text-[11px] text-gray-600 flex items-center justify-center h-full">Aucune donnée LP récente.</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <YAxis domain={['dataMin - 20', 'dataMax + 20']} hide padding={{ top: 10, bottom: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} 
                      itemStyle={{ color: '#ccc' }}
                      labelStyle={{ color: '#888', marginBottom: '4px' }}
                      content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload;
                           const index = history.findIndex((p: any) => p.date === data.date);
                           let diff = 0;
                           if (index > 0) {
                               diff = data.lp - history[index - 1].lp;
                           }

                           return (
                            <div className="bg-white text-black p-3 rounded-lg shadow-xl border border-gray-200">
                                <div className="text-gray-500 font-bold text-xs mb-1">{data.fullDate}</div>
                                <div className="text-sm font-bold"><span className="text-gray-400">Rank</span> <span className="text-teal-600 uppercase">{data.tier} {data.rank}</span></div>
                                <div className="text-sm font-bold flex gap-2">
                                    <span><span className="text-gray-400">LP</span> {data.lp}</span>
                                    {diff !== 0 && (
                                        <span className={diff > 0 ? "text-green-600" : "text-red-600"}>
                                            {diff > 0 ? "+" : ""}{diff} LP
                                        </span>
                                    )}
                                </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lp" 
                      stroke="#2dd4bf" 
                      strokeWidth={3} 
                      dot={{ r: 2, fill: '#2dd4bf', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#121212', stroke: '#2dd4bf', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                )}
             </div>
         </div>

         {/* Roles Bar */}
         <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4 relative shadow-xl flex flex-col justify-center">
             <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2">{t.roles}</h3>
             <div className="flex items-end justify-between gap-1 h-12">
                {MOCK_ROLES.map((role, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 group">
                        <div className="w-full bg-[#1a1a1a] rounded-t-sm relative h-8 flex items-end">
                            <div 
                                style={{ height: `${(role.games / 240) * 100}%` }} 
                                className={`w-full rounded-t-sm transition-all ${i === 0 ? 'bg-lol-gold' : 'bg-[#333] group-hover:bg-[#444]'}`}
                            ></div>
                        </div>
                        <span className="text-[8px] font-bold text-gray-500">{role.role.substring(0,1)}</span>
                    </div>
                ))}
             </div>
         </div>
      </div>

    </div>
  );
};
