import React from 'react';
import Image from 'next/image';
import { Participant } from '../../../types';
import { SafeLink } from '../../ui/SafeLink';

interface TeamSummaryProps {
    teamId: number;
    teamName: string;
    isWin: boolean;
    players: Participant[];
    maxDamage: number;
    maxTaken: number;
    ranks: Record<string, any>;
    region: string;
    gameDurationSeconds: number;
}

export const TeamSummary: React.FC<TeamSummaryProps> = ({ teamId, teamName, isWin, players, maxDamage, maxTaken, ranks, region, gameDurationSeconds }) => {
    return (
        <div className="flex flex-col gap-1">
            <div className={`flex items-center justify-between px-2 py-2 ${isWin ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'bg-red-500/10 border-l-2 border-red-500'} rounded-t-lg`}>
                <span className={`text-xs font-bold ${isWin ? 'text-blue-400' : 'text-red-400'}`}>{isWin ? 'VICTORY' : 'DEFEAT'} <span className="text-gray-500 text-[10px] ml-1">({teamName})</span></span>
            </div>

            <div className="flex flex-col gap-1 bg-[#121212] rounded-b-lg p-1">
                {players.map((p, i) => (
                    <ParticipantRow
                        key={i}
                        participant={p}
                        maxDamage={maxDamage}
                        maxTaken={maxTaken}
                        ranks={ranks}
                        region={region}
                        gameDurationSeconds={gameDurationSeconds}
                        isWin={isWin}
                        teamBestRank={Math.min(...players.map((x: any) => x.legendScoreRank || 10))}
                    />
                ))}
            </div>
        </div>
    );
};

interface ParticipantRowProps {
    participant: Participant;
    maxDamage: number;
    maxTaken: number;
    ranks: Record<string, any>;
    region: string;
    gameDurationSeconds: number;
    isWin: boolean;
    teamBestRank: number;
}

const ParticipantRow: React.FC<ParticipantRowProps> = ({ participant: p, maxDamage, maxTaken, ranks, region, gameDurationSeconds, isWin, teamBestRank }) => {
    const rankData = ranks[p.puuid || ''];
    const isHighElo = rankData?.solo?.tier && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rankData.solo.tier);

    let rankDisplay = p.rank || 'Unranked';
    if (rankData?.solo) {
        rankDisplay = isHighElo
            ? `${rankData.solo.tier} ${rankData.solo.lp} LP`
            : `${rankData.solo.tier} ${rankData.solo.rank}`;
    }

    const cs = (p.cs ?? 0);
    const duration = gameDurationSeconds > 0 ? gameDurationSeconds : 600;
    const csPerMin = (cs / (duration / 60)).toFixed(1);

    const kda = ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(2);
    const dmgPct = maxDamage > 0 ? (p.totalDamageDealtToChampions / maxDamage) * 100 : 0;
    const takenPct = maxTaken > 0 ? ((p.totalDamageTaken || 0) / maxTaken) * 100 : 0;
    const score = p.legendScore?.toFixed(1) || '-';
    const rank = (p as any).legendScoreRank || 0;

    // Badges
    const isTeamBest = rank === teamBestRank;
    let badge = null;
    if (isWin && isTeamBest) badge = { text: 'MVP', color: 'bg-yellow-500 text-black' };
    else if (!isWin && isTeamBest) badge = { text: 'ACE', color: 'bg-purple-500 text-white' };
    else if (rank <= 2) badge = { text: `${rank}th`, color: 'bg-gray-700 text-gray-300' };
    else badge = { text: `${rank}th`, color: 'bg-gray-800 text-gray-500' };

    const summonerLink = `/summoner/${region}/${encodeURIComponent(`${p.summonerName}-${p.tagLine || region}`)}`;

    return (
        <div className="grid grid-cols-12 gap-2 items-center p-2 hover:bg-white/5 rounded transition-colors text-sm">
            {/* Champion & Summoner & Runes */}
            <div className="col-span-3 flex items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => window.open(summonerLink, '_blank')}>
                    <Image src={p.champion.imageUrl} width={48} height={48} className="w-12 h-12 rounded-lg border border-gray-700 object-cover" alt={p.champion.name} />
                    <div className="absolute -bottom-1 -right-1 bg-black text-[10px] w-5 h-5 flex items-center justify-center rounded border border-gray-700 text-gray-400">{p.level}</div>
                </div>

                {/* Spells & Runes - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-0.5">
                    <Image src={p.spells[0]?.imageUrl} width={24} height={24} className="w-6 h-6 rounded border border-white/10" alt="Summoner Spell 1" />
                    {p.runes?.primary && <Image src={p.runes.primary} width={24} height={24} className="w-6 h-6 rounded-full bg-black border border-white/10" alt="Primary Rune" />}
                    <Image src={p.spells[1]?.imageUrl} width={24} height={24} className="w-6 h-6 rounded border border-white/10" alt="Summoner Spell 2" />
                    {p.runes?.secondary && <Image src={p.runes.secondary} width={24} height={24} className="w-6 h-6 rounded-full bg-black border border-white/10 p-0.5" alt="Secondary Rune" />}
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

                <span className="text-gray-500 mt-1">{cs} <span className="text-[10px]">({csPerMin})</span></span>
            </div>

            {/* Items */}
            <div className="col-span-3 flex justify-end gap-0.5">
                <ParticipantItems items={p.items} />
            </div>
        </div>
    );
};

const ParticipantItems = ({ items }: { items: any[] }) => {
    const rawItems = Array.isArray(items) ? items : [];
    const displayItems = [...rawItems];

    if (displayItems.length < 7) {
        const emptyCount = 7 - displayItems.length;
        for (let k = 0; k < emptyCount; k++) {
            displayItems.push({ id: 0, name: '', imageUrl: '' } as any);
        }
    }

    return (
        <>
            {displayItems.slice(0, 7).map((it, idx) => (
                <div key={idx} className={`w-8 h-8 rounded bg-[#1a1a1a] border border-white/10 overflow-hidden ${idx === 6 ? 'rounded-full ml-1' : ''}`}>
                    {it && it.id !== 0 && it.imageUrl ? (
                        <Image src={it.imageUrl} width={32} height={32} className="w-full h-full object-cover" title={it.name} alt={it.name || 'Item'} />
                    ) : null}
                </div>
            ))}
        </>
    );
};

export const ObjectiveIcon = ({ name, teamId }: { name: string, teamId: number }) => {
    const [src, setSrc] = React.useState<string>("");

    React.useEffect(() => {
        if (name === 'voidGrub') {
            setSrc("https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/grub.png");
            return;
        }
        if (name === 'tower') {
            setSrc("https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons/tower.png");
            return;
        }

        const basePath = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default";
        let iconName = "";
        switch (name) {
            case 'baron': iconName = `icon_baron-${teamId}.png`; break;
            case 'dragon': iconName = `icon_dragon-${teamId}.png`; break;
            case 'riftHerald': iconName = `icon_rift_herald-${teamId}.png`; break;
            case 'inhibitor': iconName = `icon_inhibitor-${teamId}.png`; break;
        }
        setSrc(`${basePath}/${iconName}`);
    }, [name, teamId]);

    const handleError = () => {
        const altPath = "https://raw.communitydragon.org/latest/game/assets/ux/minimap/icons";
        let altName = "";
        switch (name) {
            case 'baron': altName = "baron.png"; break;
            case 'dragon': altName = "dragon.png"; break;
            case 'riftHerald': altName = "riftherald.png"; break;
            case 'inhibitor': altName = "inhibitor.png"; break;
        }

        if (altName) {
            // Try lowercase first
            const newSrc = `${altPath}/${altName}`;
            if (src !== newSrc) {
                setSrc(newSrc);
            }
        }
    };

    if (!src) return null;

    return (
        <Image
            src={src}
            width={20}
            height={20}
            className="w-5 h-5"
            alt={name}
            onError={handleError}
            unoptimized // External CDragon images
        />
    );
};

export const TeamObjectives = ({ teams, teamId, align }: { teams: any[], teamId: number, align: 'left' | 'right' }) => {
    const team = teams.find(t => t.teamId === teamId);
    if (!team) return null;

    const stats = [
        { key: 'baron', label: 'Baron' },
        { key: 'dragon', label: 'Dragon' },
        { key: 'riftHerald', label: 'Rift Herald' },
        { key: 'voidGrub', label: 'Void Grubs' },
        { key: 'tower', label: 'Tower' },
        { key: 'inhibitor', label: 'Inhibitor' }
    ];

    const content = (
        <div className={`grid grid-cols-4 gap-x-3 gap-y-1 ${align === 'left' ? 'ml-4 border-l border-white/10 pl-4' : 'mr-4 border-r border-white/10 pr-4'}`}>
            {stats.map(stat => (
                <div key={stat.key} className={`flex items-center gap-1 text-gray-400 text-xs ${align === 'right' ? 'flex-row-reverse' : ''}`} title={stat.label}>
                    <ObjectiveIcon name={stat.key} teamId={teamId} />
                    <span>{team.objectives[stat.key]?.kills || 0}</span>
                </div>
            ))}
        </div>
    );

    return content;
};
