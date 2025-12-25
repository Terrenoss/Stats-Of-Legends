import React from 'react';
import { SummonerProfile, Language } from '../types';
import { TRANSLATIONS, MOCK_ROLES, RANK_EMBLEMS } from '../constants';
import { getProfileIconUrl } from '../utils/ddragon';
import { getRankColor, formatRank } from '../utils/formatUtils';
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
  // LP History is now handled in the parent tab, but we keep the prop for compatibility if needed later
  const safePastRanks = Array.isArray(profile.pastRanks) ? profile.pastRanks : [];
  const safeSolo = profile.ranks?.solo || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const safeFlex = profile.ranks?.flex || { tier: null, rank: null, lp: null, wins: null, losses: null };
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
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

  const rankColor = getRankColor(safeSolo.tier);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

      {/* 1. Identity & Past Ranks (Col 4) - COMPACT GOD MODE */}
      <div className="lg:col-span-4 flex flex-col justify-center">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-[#121212] p-0.5 border-2 relative z-10 transition-transform duration-500 group-hover:scale-105" style={{ borderColor: rankColor, boxShadow: `0 0 20px ${rankColor}20`, '--rank-glow': rankColor } as React.CSSProperties}>
              <img
                src={getProfileIconUrl(profile.profileIconId, version)}
                alt="Icon"
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-rank" style={{ borderColor: rankColor }}></div>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#050505] text-[9px] px-2 py-px rounded-full border font-bold font-mono z-20 whitespace-nowrap shadow-lg" style={{ borderColor: rankColor, color: rankColor }}>
              {profile.level}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col leading-none">
              <h2 className="text-4xl font-black text-white tracking-tighter font-cinzel uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {profile.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-xs font-sans font-bold tracking-widest">#{profile.tag}</span>
                {profile.consistencyBadge && (
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${profile.consistencyBadge === 'Rock Solid' ? 'border-green-500/30 text-green-400' : 'border-gray-500/30 text-gray-400'}`}>
                    {profile.consistencyBadge === 'Rock Solid' ? 'Rock' : 'Avg'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full transition-all duration-300 group relative overflow-hidden"
                onClick={onUpdateRequest}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-gray-300 group-hover:text-white flex items-center gap-2 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Invoke Update
                </span>
              </button>
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                {getLastUpdatedText()}
              </span>
            </div>
          </div>
        </div>

        {/* Past Ranks - Minimalist */}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 opacity-60 hover:opacity-100 transition-opacity">
          {safePastRanks.slice(0, 3).map((rank, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-500 font-bold">{rank.season}</span>
              <span className="text-[10px] text-gray-300 font-bold">{formatRank(rank.tier, rank.rank)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Rank Card (Col 4) - CLEAN GOD MODE */}
      <div className="lg:col-span-4 flex flex-col justify-center relative group min-w-[8.25rem]">
        {/* Subtle Glow behind the rank */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl -z-10"></div>

        <div className="flex items-center justify-center gap-4">
          {/* Rank Icon - SIZE 33 V10 */}
          <div
            className="w-[8.25rem] h-[8.25rem] -my-1 transition-transform duration-500 group-hover:scale-105 z-10 drop-shadow-2xl flex-shrink-0"
            style={{ filter: `drop-shadow(0 0 25px ${rankColor}40)` }}
          >
            {typeof safeSolo.tier === 'string' && RANK_EMBLEMS[safeSolo.tier] ? (
              <img src={RANK_EMBLEMS[safeSolo.tier]} className="w-full h-full object-contain max-w-none" alt={safeSolo.tier} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🏆</div>
            )}
          </div>

          {/* Rank Details - TEXT ONLY */}
          <div className="flex flex-col items-start z-20 max-w-[12rem] lg:max-w-[20rem]">
            <div className="text-3xl xl:text-4xl font-black font-cinzel tracking-tighter leading-none text-white drop-shadow-lg whitespace-nowrap" title={formatRank(safeSolo.tier, safeSolo.rank)}>
              {formatRank(safeSolo.tier, safeSolo.rank)}
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight mt-0.5" style={{ color: rankColor }}>
              {safeSolo.lp ?? 0} LP
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className={`text-sm font-black ${(safeSolo.wins && safeSolo.losses && (safeSolo.wins / (safeSolo.wins + safeSolo.losses)) >= 0.5)
                ? 'text-green-400'
                : 'text-red-400'
                }`}>
                {safeSolo.wins && safeSolo.losses ? Math.round((safeSolo.wins / (safeSolo.wins + safeSolo.losses)) * 100) : 0}% WR
              </div>
              <div className="text-xs text-gray-500 font-bold">
                {safeSolo.wins ?? 0}W - {safeSolo.losses ?? 0}L
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Roles & Flex (Col 4) - MINIMALIST */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* Roles Bar - Clean */}
        <div className="bg-[#121212]/50 border border-white/5 rounded-[1.5rem] p-5 relative flex flex-col justify-center flex-1">
          <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-4 text-center">{t.roles}</h3>
          <div className="flex items-end justify-between gap-2 h-16 w-full max-w-xs mx-auto opacity-80 hover:opacity-100 transition-opacity">
            {MOCK_ROLES.map((role, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1 group h-full justify-end">
                <div className="w-full bg-[#1a1a1a] rounded-t-sm relative h-full flex items-end overflow-hidden">
                  <div
                    style={{ height: `${(role.games / 240) * 100}%` }}
                    className={`w-full rounded-t-sm transition-all ${i === 0 ? 'bg-white' : 'bg-[#333] group-hover:bg-[#555]'}`}
                  ></div>
                </div>
                <span className="text-[9px] font-bold text-gray-600">{role.role.substring(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flex Rank - Tiny */}
        <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity py-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Flex</span>
          <span className="text-xs font-bold text-gray-400">{formatRank(safeFlex.tier, safeFlex.rank)}</span>
        </div>
      </div>

    </div>
  );
};
