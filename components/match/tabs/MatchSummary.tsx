import React from 'react';
import { Participant, MatchTeam } from '../../../types';
import { TRANSLATIONS } from '../../../constants';
import { SafeLink } from '../../ui/SafeLink';
import { ExternalLink } from 'lucide-react';

interface MatchSummaryProps {
    participants: Participant[];
    maxDamage: number;
    maxTaken: number;
    ranks: Record<string, any>; // puuid -> rank data
    lang: string;
    region: string;
    gameDurationSeconds: number;
    teams?: MatchTeam[];
}

export const MatchSummary: React.FC<MatchSummaryProps> = ({ participants, maxDamage, maxTaken, ranks, lang, region, gameDurationSeconds, teams }) => {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

    const calcCsPerMin = (cs: number) => {
        const duration = gameDurationSeconds > 0 ? gameDurationSeconds : 600;
        return (cs / (duration / 60)).toFixed(1);
    };

    const team100 = participants.filter(p => p.teamId === 100);
    const team200 = participants.filter(p => p.teamId === 200);
    const team100Win = team100.length ? !!team100[0].win : false;
    const team200Win = team200.length ? !!team200[0].win : false;

    // Calculate totals for header
    const t100Kills = team100.reduce((a, b) => a + b.kills, 0);
    const t200Kills = team200.reduce((a, b) => a + b.kills, 0);
    const t100Gold = team100.reduce((a, b) => a + (b.goldEarned || 0), 0);
    const t200Gold = team200.reduce((a, b) => a + (b.goldEarned || 0), 0);

    const renderTeam = (teamId: number, teamName: string, isWin: boolean, players: Participant[]) => {
        return (
            <div className="flex flex-col gap-1">
                <div className={`flex items-center justify-between px-2 py-2 ${isWin ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'bg-red-500/10 border-l-2 border-red-500'} rounded-t-lg`}>
                    <span className={`text-xs font-bold ${isWin ? 'text-blue-400' : 'text-red-400'}`}>{isWin ? 'VICTORY' : 'DEFEAT'} <span className="text-gray-500 text-[10px] ml-1">({teamName})</span></span>
                </div>

                <div className="flex flex-col gap-1 bg-[#121212] rounded-b-lg p-1">
                    {players.map((p, i) => {
                        const rankData = ranks[p.puuid || ''];
                        const isHighElo = rankData?.solo?.tier && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rankData.solo.tier);
                        const rankDisplay = rankData?.solo
                            ? (isHighElo ? `${rankData.solo.tier} ${rankData.solo.lp} LP` : `${rankData.solo.tier} ${rankData.solo.rank}`)
                            : (p.rank || 'Unranked');
                        const cs = (p.cs ?? 0);
                        const vision = p.visionScore ?? 0;
                        const kda = ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(2);
                        const dmgPct = maxDamage > 0 ? (p.totalDamageDealtToChampions / maxDamage) * 100 : 0;
                        const takenPct = maxTaken > 0 ? ((p.totalDamageTaken || 0) / maxTaken) * 100 : 0;
                        const score = p.legendScore?.toFixed(1) || '-';
                        const rank = (p as any).legendScoreRank || 0;

                        // Badges
                        const teamBestRank = Math.min(...players.map((x: any) => x.legendScoreRank || 10));
                        const isTeamBest = rank === teamBestRank;

                        let badge = null;
                        if (isWin && isTeamBest) badge = { text: 'MVP', color: 'bg-yellow-500 text-black' };
                        else if (!isWin && isTeamBest) badge = { text: 'ACE', color: 'bg-purple-500 text-white' };
                        else if (rank <= 2) badge = { text: `${rank}th`, color: 'bg-gray-700 text-gray-300' };
                        else badge = { text: `${rank}th`, color: 'bg-gray-800 text-gray-500' };

                        const summonerLink = `/summoner/${region}/${encodeURIComponent(`${p.summonerName}-${p.tagLine || region}`)}`;

                        return (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 hover:bg-white/5 rounded transition-colors text-sm">
                                {/* Champion & Summoner & Runes */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="relative group cursor-pointer" onClick={() => window.open(summonerLink, '_blank')}>
                                        <img src={p.champion.imageUrl} className="w-12 h-12 rounded-lg border border-gray-700" alt={p.champion.name} />
                                        <div className="absolute -bottom-1 -right-1 bg-black text-[10px] w-5 h-5 flex items-center justify-center rounded border border-gray-700 text-gray-400">{p.level}</div>
                                    </div>

                                    {/* Spells & Runes - 2x2 Grid */}
                                    <div className="grid grid-cols-2 gap-0.5">
                                        {/* Row 1: Spell 1, Primary Rune */}
                                        <img src={p.spells[0]?.imageUrl} className="w-6 h-6 rounded border border-white/10" alt="Summoner Spell 1" />
                                        {p.runes?.primary && <img src={p.runes.primary} className="w-6 h-6 rounded-full bg-black border border-white/10" alt="Primary Rune" />}

                                        {/* Row 2: Spell 2, Secondary Rune */}
                                        <img src={p.spells[1]?.imageUrl} className="w-6 h-6 rounded border border-white/10" alt="Summoner Spell 2" />
                                        {p.runes?.secondary && <img src={p.runes.secondary} className="w-6 h-6 rounded-full bg-black border border-white/10 p-0.5" alt="Secondary Rune" />}
                                    </div>

                                    <div className="flex flex-col min-w-0 ml-1">
                                        <div className="flex items-center gap-1">
                                            <SafeLink
                                                href={summonerLink}
                                                className="font-bold text-gray-200 truncate max-w-[100px] hover:text-white hover:underline"
                                            >
                                                {p.summonerName}
                                            </SafeLink>
                                        </div>
                                        <span className="text-xs text-gray-500">{rankDisplay}</span>
                                    </div>
                                </div>

                                {/* Legend Score */}
                                <div className="col-span-1 flex flex-col items-center justify-center">
                                    <span className="font-bold text-gray-300">{score}</span>
                                    {badge && <span className={`text-[10px] px-1.5 rounded ${badge.color} font-bold mt-0.5`}>{badge.text}</span>}
                                </div>

                                {/* KDA */}
                                <div className="col-span-2 flex flex-col items-center">
                                    <span className="font-bold text-gray-300">{p.kills}/{p.deaths}/{p.assists}</span>
                                    <span className="text-xs text-gray-500">{kda}:1</span>
                                    <span className="text-xs text-lol-red font-bold">({Math.round((p.killParticipation || 0) * 100)}%)</span>
                                </div>

                                {/* Damage */}
                                <div className="col-span-2 flex flex-col gap-1 px-2">
                                    <div className="flex items-center gap-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${dmgPct}%` }} className="h-full bg-lol-red" title={`Dealt: ${p.totalDamageDealtToChampions}`}></div>
                                    </div>
                                    <div className="flex items-center gap-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div style={{ width: `${takenPct}%` }} className="h-full bg-gray-500" title={`Taken: ${p.totalDamageTaken}`}></div>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">{p.totalDamageDealtToChampions.toLocaleString()}</div>
                                </div>

                                {/* Wards/CS */}
                                <div className="col-span-1 flex flex-col items-center text-xs text-gray-400 relative group/wards">
                                    <div className="cursor-help text-center">
                                        <div className="font-bold text-gray-300">{p.visionScore}</div>
                                        <div className="text-xs text-gray-500">{p.wardsPlaced} / {p.wardsKilled}</div>
                                    </div>

                                    {/* Ward Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/wards:block bg-black border border-gray-700 p-2 rounded z-50 w-32 shadow-xl pointer-events-none min-w-[120px]">
                                        <div className="text-xs text-gray-300 flex justify-between gap-2"><span>Balise de contrôle:</span> <span className="font-bold text-lol-gold">{p.visionWardsBoughtInGame}</span></div>
                                        <div className="text-xs text-gray-300 flex justify-between gap-2"><span>Balise placée:</span> <span className="font-bold text-white">{p.wardsPlaced}</span></div>
                                        <div className="text-xs text-gray-300 flex justify-between gap-2"><span>Balise détruite:</span> <span className="font-bold text-white">{p.wardsKilled}</span></div>
                                    </div>

                                    <span className="text-gray-500 mt-1">{cs} <span className="text-[10px]">({calcCsPerMin(cs)})</span></span>
                                </div>

                                {/* Items */}
                                <div className="col-span-3 flex justify-end gap-0.5">
                                    {(p.items || []).map((it, idx) => (
                                        <div key={idx} className="w-8 h-8 rounded bg-[#1a1a1a] border border-white/10 overflow-hidden">
                                            {it.imageUrl && <img src={it.imageUrl} className="w-full h-full object-cover" title={it.name} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const getObjectiveIcon = (name: string, teamId: number) => {
        // User provided specific URLs for grubs and towers
        if (name === 'voidGrub') {
            return <img src="https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/grub.png" className="w-5 h-5" alt="Void Grub" />;
        }
        if (name === 'tower') {
            return <img src="https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/tower.png" className="w-5 h-5" alt="Tower" />;
        }

        // Try multiple paths for others
        const basePath = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default";
        const altPath = "https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons";

        let iconName = "";
        switch (name) {
            case 'baron': iconName = `icon_baron-${teamId}.png`; break;
            case 'dragon': iconName = `icon_dragon-${teamId}.png`; break;
            case 'riftHerald': iconName = `icon_rift_herald-${teamId}.png`; break;
            case 'inhibitor': iconName = `icon_inhibitor-${teamId}.png`; break;
        }

        return (
            <img
                src={`${basePath}/${iconName}`}
                className="w-5 h-5"
                alt={name}
                onError={(e) => {
                    // Fallback to minimap icons
                    let altName = "";
                    switch (name) {
                        case 'baron': altName = "baron.png"; break;
                        case 'dragon': altName = "dragon.png"; break;
                        case 'riftHerald': altName = "riftherald.png"; break;
                        case 'inhibitor': altName = "inhibitor.png"; break;
                    }

                    if (altName) {
                        e.currentTarget.src = `${altPath}/${altName}`;
                        // Second fallback if minimap fails (e.g. case sensitivity)
                        e.currentTarget.onerror = (e2: any) => {
                            // Try capitalized
                            const capitalized = altName.charAt(0).toUpperCase() + altName.slice(1);
                            (e2.currentTarget as HTMLImageElement).src = `${altPath}/${capitalized}`;
                        };
                    }
                }}
            />
        );
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header Totals */}
            <div className="flex items-center justify-between bg-[#121212] p-4 rounded-lg border border-white/5 min-h-[80px]">
                {/* Blue Team Stats */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className={`font-bold text-lg ${team100Win ? 'text-blue-400' : 'text-red-400'}`}>{team100Win ? 'Victory' : 'Defeat'}</span>
                        <div className="flex gap-2 text-sm">
                            <span className="text-gray-400">{t100Kills} Kills</span>
                            <span className="text-lol-gold">{t100Gold.toLocaleString()} Gold</span>
                        </div>
                    </div>

                    {/* Blue Objectives */}
                    {teams && (
                        <div className="grid grid-cols-4 gap-x-3 gap-y-1 ml-4 border-l border-white/10 pl-4">
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Baron">{getObjectiveIcon('baron', 100)} {teams.find(t => t.teamId === 100)?.objectives.baron.kills}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Dragon">{getObjectiveIcon('dragon', 100)} {teams.find(t => t.teamId === 100)?.objectives.dragon.kills}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Rift Herald">{getObjectiveIcon('riftHerald', 100)} {teams.find(t => t.teamId === 100)?.objectives.riftHerald.kills}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Void Grubs">{getObjectiveIcon('voidGrub', 100)} {teams.find(t => t.teamId === 100)?.objectives.voidGrub?.kills || 0}</div>

                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Tower">{getObjectiveIcon('tower', 100)} {teams.find(t => t.teamId === 100)?.objectives.tower.kills}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Inhibitor">{getObjectiveIcon('inhibitor', 100)} {teams.find(t => t.teamId === 100)?.objectives.inhibitor.kills}</div>
                        </div>
                    )}
                </div>

                {/* Red Team Stats */}
                <div className="flex items-center gap-6">
                    {/* Red Objectives */}
                    {teams && (
                        <div className="grid grid-cols-4 gap-x-3 gap-y-1 mr-4 border-r border-white/10 pr-4">
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Baron">{teams.find(t => t.teamId === 200)?.objectives.baron.kills} {getObjectiveIcon('baron', 200)}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Dragon">{teams.find(t => t.teamId === 200)?.objectives.dragon.kills} {getObjectiveIcon('dragon', 200)}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Rift Herald">{teams.find(t => t.teamId === 200)?.objectives.riftHerald.kills} {getObjectiveIcon('riftHerald', 200)}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Void Grubs">{teams.find(t => t.teamId === 200)?.objectives.voidGrub?.kills || 0} {getObjectiveIcon('voidGrub', 200)}</div>

                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Tower">{teams.find(t => t.teamId === 200)?.objectives.tower.kills} {getObjectiveIcon('tower', 200)}</div>
                            <div className="flex items-center gap-1 text-gray-400 text-xs" title="Inhibitor">{teams.find(t => t.teamId === 200)?.objectives.inhibitor.kills} {getObjectiveIcon('inhibitor', 200)}</div>
                        </div>
                    )}

                    <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg ${team200Win ? 'text-blue-400' : 'text-red-400'}`}>{team200Win ? 'Victory' : 'Defeat'}</span>
                        <div className="flex gap-2 text-sm">
                            <span className="text-lol-gold">{t200Gold.toLocaleString()} Gold</span>
                            <span className="text-gray-400">{t200Kills} Kills</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Summoner</div>
                <div className="col-span-1 text-center">Score</div>
                <div className="col-span-2 text-center">KDA</div>
                <div className="col-span-2 text-center">Dégâts</div>
                <div className="col-span-1 text-center">Vision/CS</div>
                <div className="col-span-3 text-right">Items</div>
            </div>

            {renderTeam(100, 'Blue Team', team100Win, team100)}
            {renderTeam(200, 'Red Team', team200Win, team200)}
        </div>
    );
};
