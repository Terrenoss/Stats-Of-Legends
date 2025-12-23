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
  version?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, lang, onUpdateRequest, lpHistory, version }) => {
  const t = TRANSLATIONS[lang];
  const history = lpHistory && lpHistory.length ? lpHistory : [];
  const safePastRanks = Array.isArray(profile.pastRanks) ? profile.pastRanks : [];
  const safeSolo = profile.ranks?.solo || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const safeFlex = profile.ranks?.flex || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const [now, setNow] = React.useState(() => Date.now());
  const hasLadder = typeof profile.ladderRank === 'number' && profile.ladderRank > 0 && typeof profile.topPercent === 'number' && profile.topPercent > 0;
  const currentVersion = version || CURRENT_PATCH;

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

  const formatRank = (tier: string | null, rank: string | null) => {
    if (!tier) return 'UNRANKED';
    const t = tier.toUpperCase();
    if (['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(t)) {
      return t;
    }
    return `${t} ${rank || ''}`;
  };

  const getPeakRank = () => {
    // Simple heuristic: compare current vs past ranks
    // We need a value system
    const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const getValue = (tier: string, rank: string, lp: number = 0) => {
      const tIdx = tiers.indexOf(tier.toUpperCase());
      if (tIdx === -1) return -1;
      // Rank IV=1, I=4. 
      const rVal = rank === 'I' ? 4 : rank === 'II' ? 3 : rank === 'III' ? 2 : rank === 'IV' ? 1 : 0;
      return tIdx * 10000 + rVal * 1000 + lp;
    };

    let peak = { tier: safeSolo.tier, rank: safeSolo.rank, lp: safeSolo.lp, source: 'Current' };
    let maxVal = getValue(safeSolo.tier || '', safeSolo.rank || '', safeSolo.lp || 0);

    safePastRanks.forEach(r => {
      const val = getValue(r.tier, r.rank);
      if (val > maxVal) {
        maxVal = val;
        peak = { tier: r.tier, rank: r.rank, lp: 0, source: 'Past' }; // We don't have LP for past ranks usually
      }
    });

    if (!peak.tier || peak.tier === 'UNRANKED') return { display: 'UNKNOWN', icon: null };

    const display = formatRank(peak.tier, peak.rank) + (peak.lp ? ` - ${peak.lp} LP` : '');
    return { display, icon: peak.tier };
  };

  const getNextTier = (tier: string | null) => {
    if (!tier) return null;
    const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const idx = tiers.indexOf(tier.toUpperCase());
    if (idx === -1 || idx === tiers.length - 1) return null;
    return tiers[idx + 1];
  };

  const peakRank = getPeakRank();
  const currentTier = safeSolo.tier;
  const nextTier = getNextTier(currentTier);
  const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(currentTier?.toUpperCase() || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

      {/* 1. Identity & Past Ranks (Col 4) */}
      <div className="lg:col-span-4 bg-[#121212] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl flex flex-col">
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-[1.5rem] bg-[#121212] p-1 border border-lol-gold/50 shadow-glow-gold relative z-10">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/profileicon/${profile.profileIconId}.png`}
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
                  <span className="text-[10px] text-gray-200 font-bold">{formatRank(rank.tier, rank.rank)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Rank Card (Col 4) - Redesigned */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[#1e1b2e] border border-white/10 rounded-[1.5rem] relative overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-5 pb-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-white/50 rounded-full"></div>
            <span className="text-gray-300 font-bold text-sm">Classé Solo</span>
          </div>

          {/* Main Content */}
          <div className="px-6 flex items-start justify-between relative z-10">
            {/* Rank Icon */}
            <div className="w-20 h-20 -ml-2">
              {typeof safeSolo.tier === 'string' && RANK_EMBLEMS[safeSolo.tier] ? (
                <img src={RANK_EMBLEMS[safeSolo.tier]} className="w-full h-full object-contain drop-shadow-2xl" alt={safeSolo.tier} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🏆</div>
              )}
            </div>

            {/* Rank Details */}
            <div className="text-right">
              <div className="text-2xl font-black text-blue-200 font-display tracking-wide">
                {formatRank(safeSolo.tier, safeSolo.rank)} <span className="text-white">– {safeSolo.lp ?? 0} LP</span>
              </div>
              <div className="text-gray-400 font-bold text-sm mt-0.5">
                {safeSolo.wins ?? 0}W - {safeSolo.losses ?? 0}L <span className="text-gray-500">({safeSolo.wins && safeSolo.losses ? Math.round((safeSolo.wins / (safeSolo.wins + safeSolo.losses)) * 100) : 0}%)</span>
              </div>
            </div>
          </div>

          {/* Ladder Rank Badge */}
          {hasLadder && (
            <div className="px-6 mt-4">
              <div className="bg-[#2a263d] rounded-lg py-1.5 px-3 flex items-center justify-center gap-2 text-xs border border-white/5">
                <span className="text-gray-500 font-bold uppercase tracking-wider">LADDER RANK</span>
                <span className="text-white font-bold text-sm">{profile.ladderRank.toLocaleString()}th</span>
                <span className="text-gray-500">({profile.topPercent}%)</span>
              </div>
            </div>
          )}

          {/* 30d Delta */}
          <div className="px-6 mt-4 flex items-center justify-center gap-2">
            <span className="text-gray-400 text-xs">Last 30d</span>
            {(() => {
              if (history.length < 2) return <span className="text-gray-500 text-xs">-</span>;
              const first = history[0];
              const last = history[history.length - 1];
              const delta = last.lp - first.lp;
              return (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${delta >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  <span className="font-bold text-xs">{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} LP</span>
                </div>
              );
            })()}
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-[140px] mt-4 relative px-2">
            {/* Rank Separators (Only for non-Apex) */}
            {!isApex && nextTier && (
              <div className="absolute top-[10%] left-0 right-0 flex items-center gap-2 px-4 z-0 opacity-50">
                <div className="w-5 h-5">
                  {RANK_EMBLEMS[nextTier] && <img src={RANK_EMBLEMS[nextTier]} alt={nextTier} />}
                </div>
                <div className="h-px bg-green-500/30 w-full border-t border-dashed border-green-500/50"></div>
              </div>
            )}
            {!isApex && currentTier && (
              <div className="absolute bottom-[10%] left-0 right-0 flex items-center gap-2 px-4 z-0 opacity-50">
                <div className="w-5 h-5">
                  {RANK_EMBLEMS[currentTier] && <img src={RANK_EMBLEMS[currentTier]} alt={currentTier} />}
                </div>
                <div className="h-px bg-blue-500/30 w-full border-t border-dashed border-blue-500/50"></div>
              </div>
            )}

            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <defs>
                    <linearGradient id="colorLp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* Force domain to 0-100 for non-apex to align with visual separators */}
                  <YAxis
                    domain={isApex ? ['dataMin - 20', 'dataMax + 20'] : [0, 100]}
                    hide
                    padding={{ top: 10, bottom: 10 }}
                  />
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0f0e17] text-white p-3 rounded-xl shadow-2xl border border-white/10 min-w-[120px]">
                            <div className="text-gray-400 text-[10px] font-bold mb-1 text-center">{data.date}</div>
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 mb-1">
                                {RANK_EMBLEMS[data.tier] && <img src={RANK_EMBLEMS[data.tier]} alt="" />}
                              </div>
                              <div className="text-lg font-bold font-display">{formatRank(data.tier, data.rank)} - <span className="text-blue-300">{data.lp} LP</span></div>
                              <div className="text-[10px] text-gray-500 mt-1">3 games</div>
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
                    stroke="#93c5fd"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#1e1b2e', stroke: '#93c5fd', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 text-xs">No history</div>
            )}
          </div>

          {/* Footer Peak */}
          <div className="bg-[#232036] py-3 px-6 flex items-center justify-center gap-2 border-t border-white/5">
            <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">PEAK</span>
            {peakRank.icon ? (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4">
                  {RANK_EMBLEMS[peakRank.icon] && <img src={RANK_EMBLEMS[peakRank.icon]} alt="" />}
                </div>
                <span className="text-blue-200 font-bold text-xs">{peakRank.display}</span>
              </div>
            ) : (
              <span className="text-gray-400 font-bold text-xs">UNKNOWN</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Roles & Flex (Col 4) */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Flex Rank */}
        <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 relative overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center border border-white/5 p-1">
            {typeof safeFlex.tier === 'string' && RANK_EMBLEMS[safeFlex.tier] ? (
              <img src={RANK_EMBLEMS[safeFlex.tier]} className="w-full h-full object-contain grayscale opacity-80" alt={safeFlex.tier} />
            ) : (
              <span className="font-display text-xl font-black text-gray-400">U</span>
            )}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Flex</div>
            <div className="text-gray-300 font-bold font-display text-sm tracking-wide">{formatRank(safeFlex.tier, safeFlex.rank)} • {safeFlex.lp ?? '-'} LP</div>
          </div>
        </div>

        {/* Roles Bar */}
        <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-5 relative shadow-xl flex flex-col justify-center flex-1">
          <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-4">{t.roles}</h3>
          <div className="flex items-end justify-between gap-2 h-24">
            {MOCK_ROLES.map((role, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                <div className="w-full bg-[#1a1a1a] rounded-t-lg relative h-full flex items-end overflow-hidden">
                  <div
                    style={{ height: `${(role.games / 240) * 100}%` }}
                    className={`w-full rounded-t-lg transition-all ${i === 0 ? 'bg-lol-gold' : 'bg-[#333] group-hover:bg-[#444]'}`}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500">{role.role.substring(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
