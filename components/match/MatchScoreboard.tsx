import React from 'react';
import Image from 'next/image';
import { Participant } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { SafeLink } from '../ui/SafeLink';
import { ParticipantRow, ParticipantItems, ParticipantWard, TeamSection } from './MatchScoreboardComponents';
import { isWardItem, normalizeWardType } from '../../utils/matchUtils';

import { Language } from '../../types';

interface MatchScoreboardProps {
  participants: Participant[];
  maxDamage: number;
  mvpId: string;
  aceId: string;
  lang: Language;
  gameDurationSeconds?: number; // ajouté pour calculer cs/m
}

const TEAM_BLUE_ID = 100;
const TEAM_RED_ID = 200;
const DEFAULT_GAME_DURATION = 600; // 10 minutes fallback


export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ participants, maxDamage, mvpId, aceId, lang, gameDurationSeconds }) => {
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  const calcCsPerMin = (p: Participant) => {
    const cs = (p.cs ?? 0);
    const duration = (gameDurationSeconds && gameDurationSeconds > 0) ? gameDurationSeconds : DEFAULT_GAME_DURATION;
    const minutes = Math.max(0.1, duration / 60);
    return +(cs / minutes).toFixed(1);
  };

  const team100 = participants.filter(p => p.teamId === TEAM_BLUE_ID);
  const team200 = participants.filter(p => p.teamId === TEAM_RED_ID);
  const team100Win = team100.length ? !!team100[0].win : false;
  const team200Win = team200.length ? !!team200[0].win : false;

  // Determine MVP gold: best gold from winning team
  let winningTeamId: number | null = null;
  if (team100Win) winningTeamId = TEAM_BLUE_ID;
  else if (team200Win) winningTeamId = TEAM_RED_ID;

  let losingTeamId: number | null = null;
  if (winningTeamId === TEAM_BLUE_ID) losingTeamId = TEAM_RED_ID;
  else if (winningTeamId === TEAM_RED_ID) losingTeamId = TEAM_BLUE_ID;

  // compute arrays for potential use
  const winningTeamParticipants = winningTeamId ? participants.filter(p => p.teamId === winningTeamId) : [];

  // compute best gold on winning team (used for MVP gold badge)
  const bestGoldOnWinningTeam = winningTeamParticipants.length ? Math.max(...winningTeamParticipants.map(p => Number(p.goldEarned || 0))) : 0;

  const getBestParticipant = (teamId: number | null) => {
    if (!teamId) return null;
    const team = participants.filter(p => p.teamId === teamId);
    if (!team.length) return null;
    return team.reduce((best, p) => {
      const pScore = p.legendScore ?? 0;
      const bestScore = best.legendScore ?? 0;
      return pScore > bestScore ? p : best;
    }, team[0]);
  };

  const bestOfWinningTeam = getBestParticipant(winningTeamId);
  const bestOfLosingTeam = getBestParticipant(losingTeamId);

  // Helper: pick best by legendScore (tie-breaker: damage -> kills -> gold)
  const getBestByOp = (arr: Participant[]): Participant | null => {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((best, p) => {
      const pScore = Number(p.legendScore ?? -Infinity);
      const bScore = Number((best as Participant).legendScore ?? -Infinity);
      if (pScore !== bScore) return pScore > bScore ? p : best;
      const pDmg = Number(p.totalDamageDealtToChampions ?? 0);
      const bDmg = Number((best as Participant).totalDamageDealtToChampions ?? 0);
      if (pDmg !== bDmg) return pDmg > bDmg ? p : best;
      const pKills = Number(p.kills ?? 0);
      const bKills = Number((best as Participant).kills ?? 0);
      if (pKills !== bKills) return pKills > bKills ? p : best;
      const pGold = Number(p.goldEarned ?? 0);
      const bGold = Number((best as Participant).goldEarned ?? 0);
      return pGold >= bGold ? p : best;
    }, arr[0]);
  };

  // Helper: pick best by gold (tie-breaker: legendScore -> damage -> kills)
  const getBestByGold = (arr: Participant[]): Participant | null => {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((best, p) => {
      const pGold = Number(p.goldEarned ?? -Infinity);
      const bGold = Number((best as Participant).goldEarned ?? -Infinity);
      if (pGold !== bGold) return pGold > bGold ? p : best;
      const pScore = Number(p.legendScore ?? -Infinity);
      const bScore = Number((best as Participant).legendScore ?? -Infinity);
      if (pScore !== bScore) return pScore > bScore ? p : best;
      const pDmg = Number(p.totalDamageDealtToChampions ?? 0);
      const bDmg = Number((best as Participant).totalDamageDealtToChampions ?? 0);
      if (pDmg !== bDmg) return pDmg > bDmg ? p : best;
      const pKills = Number(p.kills ?? 0);
      const bKills = Number((best as Participant).kills ?? 0);
      return pKills >= bKills ? p : best;
    }, arr[0]);
  };

  const losingTeamParticipants = losingTeamId ? participants.filter(p => p.teamId === losingTeamId) : [];
  const bestLosingByOp = getBestByOp(losingTeamParticipants as Participant[]);
  const bestWinningByGold = winningTeamId ? getBestByGold(winningTeamParticipants as Participant[]) : null;

  const context = {
    maxDamage,
    calcCsPerMin,
    isWardItem,
    normalizeWardType
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1 border-b border-white/5 pb-2">
        <div className="col-span-4 lg:col-span-3">Summoner</div>
        <div className="col-span-3 lg:col-span-2 text-center">KDA</div>
        <div className="hidden lg:block col-span-2 text-center">{t.damage}</div>
        <div className="hidden lg:block col-span-2 text-center">CS</div>
        <div className="col-span-5 lg:col-span-3 text-right">Items</div>
      </div>

      <TeamSection
        teamName={t.teamBlue}
        isWin={team100Win}
        participants={team100}
        bestWinningByGold={bestWinningByGold}
        bestLosingByOp={bestLosingByOp}
        context={context}
      />
      <div className="h-px bg-white/5"></div>
      <TeamSection
        teamName={t.teamRed}
        isWin={team200Win}
        participants={team200}
        bestWinningByGold={bestWinningByGold}
        bestLosingByOp={bestLosingByOp}
        context={context}
      />
    </div>
  );
};
