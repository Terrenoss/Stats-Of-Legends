import React from 'react';
import { Participant } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface MatchScoreboardProps {
  participants: Participant[];
  maxDamage: number;
  mvpId: string;
  aceId: string;
  lang: string;
  gameDurationSeconds?: number; // ajouté pour calculer cs/m
}

export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ participants, maxDamage, mvpId, aceId, lang, gameDurationSeconds }) => {
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  const calcCsPerMin = (p: Participant) => {
    const cs = (p.cs ?? 0);
    const duration = (gameDurationSeconds && gameDurationSeconds > 0) ? gameDurationSeconds : 600; // fallback 10min to avoid huge numbers
    const minutes = Math.max(0.1, duration / 60);
    return +(cs / minutes).toFixed(1);
  };

  const team100 = participants.filter(p => p.teamId === 100);
  const team200 = participants.filter(p => p.teamId === 200);
  const team100Win = team100.length ? !!team100[0].win : false;
  const team200Win = team200.length ? !!team200[0].win : false;

  // Determine MVP gold: best gold from winning team
  const winningTeamId = team100Win ? 100 : (team200Win ? 200 : null);
  const losingTeamId = winningTeamId === 100 ? 200 : (winningTeamId === 200 ? 100 : null);

  // compute arrays for potential use
  const winningTeamParticipants = winningTeamId ? participants.filter(p => p.teamId === winningTeamId) : [];

  // compute best gold on winning team (used for MVP gold badge)
  const bestGoldOnWinningTeam = winningTeamParticipants.length ? Math.max(...winningTeamParticipants.map(p => Number(p.goldEarned || 0))) : 0;

  const bestOfWinningTeam: Participant | null = (() => {
    if (!winningTeamId) return null;
    const team = participants.filter(p => p.teamId === winningTeamId);
    return team.length ? team.reduce((best, p) => (p.opScore ?? 0) > (best.opScore ?? 0) ? p : best, team[0]) : null;
  })();

  const bestOfLosingTeam: Participant | null = (() => {
    if (!losingTeamId) return null;
    const team = participants.filter(p => p.teamId === losingTeamId);
    return team.length ? team.reduce((best, p) => (p.opScore ?? 0) > (best.opScore ?? 0) ? p : best, team[0]) : null;
  })();

  // Helper: pick best by opScore (tie-breaker: damage -> kills -> gold)
  const getBestByOp = (arr: Participant[]) : Participant | null => {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((best, p) => {
      const pScore = Number(p.opScore ?? -Infinity);
      const bScore = Number((best as Participant).opScore ?? -Infinity);
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

  // Helper: pick best by gold (tie-breaker: opScore -> damage -> kills)
  const getBestByGold = (arr: Participant[]) : Participant | null => {
    if (!arr || arr.length === 0) return null;
    return arr.reduce((best, p) => {
      const pGold = Number(p.goldEarned ?? -Infinity);
      const bGold = Number((best as Participant).goldEarned ?? -Infinity);
      if (pGold !== bGold) return pGold > bGold ? p : best;
      const pScore = Number(p.opScore ?? -Infinity);
      const bScore = Number((best as Participant).opScore ?? -Infinity);
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

  // robust participant equality: prefer puuid, then participantId, then summonerName
  const participantEquals = (a?: Participant | null, b?: Participant | null) => {
    if (!a || !b) return false;
    if (a.puuid && b.puuid) return a.puuid === b.puuid;
    if (a.participantId !== undefined && b.participantId !== undefined) return a.participantId === b.participantId;
    if (a.summonerName && b.summonerName) return a.summonerName === b.summonerName;
    return false;
  };

  const teamBestOpScore: Record<number, number> = {};
  [100, 200].forEach(teamId => {
    const team = participants.filter(p => p.teamId === teamId);
    const best = team.reduce((acc, p) => Math.max(acc, (p.opScore ?? 0)), 0);
    teamBestOpScore[teamId] = best;
  });

  const normalizeWardType = (item: any) => {
    if (!item) return null;
    const name = (typeof item.name === 'string') ? item.name.toLowerCase() : '';
    // Control Ward should not be treated as placed ward, Oracle Lens is shown as 'Oracle' (dewarder)
    if (/control/i.test(name)) return 'Control';
    if (/oracle|lens/i.test(name)) return 'Oracle';
    // Farsight is a ward/trinket that places a vision object at range
    if (/farsight/i.test(name)) return 'Farsight';
    if (/stealth/i.test(name) || /sight/i.test(name)) return 'Stealth';
    if (item.tags && Array.isArray(item.tags) && item.tags.includes('Ward')) return 'Sight';
    if (/ward/i.test(name)) return 'Sight';
    return null;
  };

  const isWardItem = (item: any) => {
    const t = normalizeWardType(item);
    // Only treat these types as placed wards (not Control)
    return t === 'Stealth' || t === 'Sight' || t === 'Farsight' || t === 'Oracle';
  };

  // Team section receives computed best players via closure variables above to ensure correctness
  const TeamSection = ({ teamId, teamName, isWin }: { teamId: number, teamName: string, isWin: boolean }) => {
    const teamParticipants = participants.filter(p => p.teamId === teamId);
    // pick team best (for grey MVP)
    const teamBest = teamParticipants.reduce((best, p) => ((p.opScore ?? 0) > (best.opScore ?? 0) ? p : best), teamParticipants[0] || null);

    return (
        <div className="flex flex-col gap-1">
            <div className={`text-xs font-bold px-2 mb-2 flex justify-between items-center ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
                <span>{isWin ? 'VICTORY' : 'DEFEAT'}</span>
                <span className="text-gray-600 text-[10px] uppercase">{teamName}</span>
            </div>
            {teamParticipants.map((p, i) => {
                // ACE logic: only if explicit field present (p.ace === true or p.aceCount > 0)
                const isAce = !!p.ace || (Number(p.aceCount ?? 0) > 0);
                // MVP: gold only for best of winning team; grey for best of losing team
                // Use goldEarned to determine the gold MVP for the winning team
                const isMvpGold = !!bestWinningByGold && participantEquals(p, bestWinningByGold);
                const isMvpGrey = !!bestLosingByOp && participantEquals(p, bestLosingByOp);

                // Safe accessors and fallbacks
                const champImg = p.champion?.imageUrl ?? null;
                const champName = p.champion?.name ?? 'Unknown';
                // keep ward items separated so we can display their name/type there
                const items = Array.isArray(p.items) ? p.items : [];
                // filter out ward/trinket items from the main items list to avoid duplicate representation
                const itemsFiltered = items.filter(it => !isWardItem(it));
                const damage = typeof p.totalDamageDealtToChampions === 'number' ? p.totalDamageDealtToChampions : Number(p.totalDamageDealtToChampions ?? 0);
                const damageTaken = typeof p.totalDamageTaken === 'number' ? p.totalDamageTaken : Number(p.totalDamageTaken ?? 0);
                const kills = p.kills ?? 0;
                const deaths = p.deaths ?? 0;
                const assists = p.assists ?? 0;
                const kdaValue = ((kills + assists) / Math.max(1, deaths));
                const damagePct = maxDamage > 0 ? Math.min(100, (damage / maxDamage) * 100) : 0;

                 return (
                 <div key={i} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors ${p.summonerName === 'Faker' ? 'bg-lol-gold/5 border border-lol-gold/20' : ''}`}>
           
                    {/* Champ & Name */}
                    <div className="col-span-4 lg:col-span-3 flex items-center gap-3 overflow-hidden">
                        <div className="relative">
                            {champImg ? (
                              <img src={champImg} className="w-8 h-8 rounded-lg border border-gray-700" alt={champName} />
                            ) : (
                              <div className="w-8 h-8 rounded-lg border border-gray-700 bg-white/5 flex items-center justify-center text-xs font-bold text-gray-300">{(champName && typeof champName === 'string') ? champName.charAt(0) : '?'}</div>
                            )}
                             <div className="absolute -bottom-1 -right-1 bg-black text-[8px] w-4 h-4 flex items-center justify-center rounded text-gray-400 border border-gray-800">{p.level ?? '-'}</div>
                         </div>
                         <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-bold truncate ${p.summonerName === 'Faker' ? 'text-lol-gold' : 'text-gray-300'}`}>
                                {p.summonerName ?? 'Unranked'}{p.tagLine ? `#${p.tagLine}` : ''}
                             </span>
                             <span className="text-[9px] text-gray-600">{p.rank || "Unranked"}</span>
                        </div>
                    </div>

                    {/* KDA & Badge */}
                    <div className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center relative">
                        <div className="text-xs text-gray-200 font-bold tracking-wider">{kills}/{deaths}/{assists}</div>
                        <div className="text-[9px] text-gray-500 font-mono">{kdaValue.toFixed(2)}:1</div>
                         {/* Render badges exclusively to avoid overlap: ACE has priority over MVP */}
                         {isAce ? (
                              <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[8px] px-1 rounded font-bold">ACE</div>
                         ) : (isMvpGold ? (
                              <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-[8px] px-1 rounded font-bold">MVP</div>
                         ) : (isMvpGrey ? (
                              <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gray-500/10 text-gray-300 border border-gray-500/30 text-[8px] px-1 rounded font-bold">MVP</div>
                         ) : null))}
                     </div>

                     {/* Damage Bar (Desktop) */}
                     <div className="hidden lg:flex col-span-2 flex-col justify-center gap-1 px-2">
                        <div className="text-[10px] text-center text-gray-400">{damage.toLocaleString()}</div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div style={{ width: `${damagePct}%` }} className="h-full bg-lol-red"></div>
                        </div>
                     </div>

                     {/* CS */}
                     <div className="hidden lg:flex col-span-2 text-center flex-col justify-center">
                        <div className="text-xs text-gray-300">{p.cs ?? 0}</div>
                         <div className="text-[9px] text-gray-500">{calcCsPerMin(p)}/m</div>
                     </div>

                     {/* Items */}
                     <div className="col-span-5 lg:col-span-3 flex justify-end gap-1">
                        {itemsFiltered.map((item, idx) => {
                             if (!item) return null;
                             if (item.imageUrl) {
                                const action = (item as any).action;
                                let title;
                                if (item.name) title = item.name + (action ? ' (' + action + ')' : '');
                                 return (
                                   <img key={idx} src={item.imageUrl} className="w-6 h-6 rounded bg-[#121212] border border-white/10" alt={item.name} title={title} />
                                 );
                             }
                             return (<div key={idx} className="w-6 h-6 rounded bg-white/5 border border-white/10" />);
                         })}
                         {/* Ward indicator: show a small icon with ward type if present */}
                         { (Array.isArray(items) && items.find(isWardItem)) ? (() => {
                            const wardItem = items.find(isWardItem);
                            const wardType = normalizeWardType(wardItem) || 'Ward';
                            return (
                              <div className="w-6 h-6 rounded-full bg-black border border-gray-700 ml-1 flex items-center justify-center text-[10px] font-bold text-gray-200" title={wardItem?.name || wardType}>
                                  { wardItem?.imageUrl ? <img src={wardItem.imageUrl} className="w-4 h-4" alt={wardItem?.name || 'Ward'} /> : <span>W</span> }
                              </div>
                            );
                         })() : (
                            <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 ml-1"></div>
                         )}
                     </div>

                 </div>
                 );
             })}
        </div>
    );
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

        <TeamSection teamId={100} teamName={t.teamBlue} isWin={team100Win} />
        <div className="h-px bg-white/5"></div>
        <TeamSection teamId={200} teamName={t.teamRed} isWin={team200Win} />
    </div>
  );
};
