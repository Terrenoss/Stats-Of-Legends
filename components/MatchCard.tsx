"use client";

import React from 'react';
import Image from 'next/image';
import { Match, Participant } from '../types';
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
import { getRankIconUrl, getQueueLabel, getTimeAgo } from '../utils/formatUtils';
import { MatchInfo, ChampionInfo, KDAInfo, ItemsList, MatchCardTabs, LegendScoreBadge } from './match/card/MatchCardComponents';
import { useMatchCard } from '../hooks/useMatchCard';

interface MatchCardProps {
  match: Match;
  region?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, region = 'EUW' }) => {
  const { activeTab, setActiveTab, ranks, ranksLoaded, toggleTab } = useMatchCard(match, region);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const me = match.me || ({} as Participant);
  const isWin = !!me.win;
  const rawKills = me.kills ?? 0;
  const kills = Number(rawKills);
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

  const participants = match.participants || [];
  const maxDamage = Math.max(...participants.map((p) => Number(p.totalDamageDealtToChampions || 0)), 0);
  const maxTaken = Math.max(...participants.map((p) => Number(p.totalDamageTaken || 0)), 0);

  const champName = me.champion?.name || 'Unknown';
  const spells = Array.isArray(me?.spells) ? me.spells : [];

  const containerClass = `mb-2 relative rounded-[1rem] border transition-all duration-300 group
    ${isWin
      ? 'border-lol-win/20 bg-[#0a120f] hover:bg-[#0f1a15]'
      : 'border-red-900/20 bg-gradient-to-r from-[#1a0505] to-[#0f0505] hover:to-[#2a0a0a]'
    }
  `;

  const myScore = me.legendScore || 0;
  const maxScore = Math.max(...(match.participants || []).map((p) => p.legendScore || 0));
  const isMvp = myScore > 0 && myScore === maxScore && isWin;

  const matchInfoUtils = {
    getQueueLabel: () => getQueueLabel(match, t),
    getTimeAgo: () => getTimeAgo(match.gameCreation),
    t
  };

  const csScore = me.cs ?? 0;
  const visionScore = me.visionScore ?? 0;

  return (
    <div className={containerClass} style={isMvp ? { borderColor: '#ffd700', boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' } : {}}>
      <div className="absolute inset-0 overflow-hidden rounded-[1rem] pointer-events-none z-0">
        {isMvp && (
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-challenger.png')] bg-repeat opacity-5 mix-blend-overlay animate-pulse-gold"></div>
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-yellow-500/5 to-transparent animate-spin-slow"></div>
          </div>
        )}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[40%] opacity-20 grayscale-[0.5] mix-blend-screen hidden md:block transition-all duration-500 group-hover:opacity-40 group-hover:grayscale-0 group-hover:translate-x-[35%]">
          <RankIcon match={match} ranks={ranks} ranksLoaded={ranksLoaded} />
        </div>
      </div>

      <div className="p-3 pl-5 flex flex-col md:flex-row gap-4 items-center relative z-10">
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[1rem] ${isWin ? 'bg-lol-win shadow-[0_0_15px_#22c55e]' : 'bg-red-900/50'}`}></div>

        <MatchInfo
          details={{ isWin, durationMin, durationSec }}
          utils={matchInfoUtils}
        />
        <ChampionInfo isWin={isWin} champName={champName} me={me} spells={spells} getChampionIconUrl={getChampionIconUrl} />
        <KDAInfo
          stats={{ kills, deaths, assists, kda }}
          context={{ isWin, match, me }}
        />

        <LegendScoreBadge me={me} />

        <ItemsList me={me} />

        <div className="hidden md:flex flex-col text-xs text-gray-400 border-l border-white/5 pl-4 gap-1 min-w-[120px] relative justify-center">
          <div className="flex justify-between w-full relative z-10" title="Total Damage Dealt to Champions">
            <span>Dmg</span> <span className="text-gray-200 font-bold">{(me.damage || me.totalDamageDealtToChampions || 0).toLocaleString()} <span className="text-[9px] text-gray-500">({(me.damagePerMin || 0).toFixed(0)}/m)</span></span>
          </div>
          <div className="flex justify-between w-full relative z-10" title="Total Gold Earned">
            <span>Gold</span> <span className="text-lol-gold font-bold">{(me.gold || me.goldEarned || 0).toLocaleString()} <span className="text-[9px] text-gray-500">({(me.goldPerMin || 0).toFixed(0)}/m)</span></span>
          </div>
          <div className="flex justify-between w-full relative z-10"><span>CS</span> <span className="text-gray-200 font-bold">{csScore} <span className="text-[9px] text-gray-500">({csPerMinHeader}/m)</span></span></div>
          <div className="flex justify-between w-full relative z-10"><span>Vision</span> <span className="text-gray-200 font-bold">{visionScore}</span></div>
        </div>

        <div className="flex-grow flex justify-end">
          <button
            onClick={() => toggleTab(activeTab === 'NONE' ? 'SUMMARY' : 'NONE')}
            className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 ${activeTab !== 'NONE' ? 'bg-white/10 rotate-180 border-white/30 text-white' : 'text-gray-500'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab !== 'NONE' && (
        <MatchCardTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

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

const RankIcon = ({ match, ranks, ranksLoaded }: { match: Match, ranks: any, ranksLoaded: boolean }) => {
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

  if (!icon) return null;

  return (
    <Image src={icon} alt={avgRank} title={avgRank} width={350} height={350} className="max-w-none object-contain drop-shadow-2xl" />
  );
};
