import React from 'react';
import Image from 'next/image';
import { Participant } from '../../types';
import { SafeLink } from '../ui/SafeLink';

export interface ParticipantRowProps {
    participant: Participant;
    context: {
        maxDamage: number;
        calcCsPerMin: (p: Participant) => number;
        isWardItem: (item: any) => boolean;
        normalizeWardType: (item: any) => string | null;
    };
    badges: {
        isAce: boolean;
        isMvpGold: boolean;
        isMvpGrey: boolean;
    };
}

export const ParticipantRow: React.FC<ParticipantRowProps> = ({ participant, context, badges }) => {
    const { p } = { p: participant }; // Alias for less code change inside
    const { maxDamage, calcCsPerMin, isWardItem, normalizeWardType } = context;
    const { isAce, isMvpGold, isMvpGrey } = badges;

    const champImg = p.champion?.imageUrl ?? null;
    const champName = p.champion?.name ?? 'Unknown';
    const items = Array.isArray(p.items) ? p.items : [];
    const itemsFiltered = items.filter((it: any) => !isWardItem(it));
    const damage = Number(p.totalDamageDealtToChampions ?? 0);
    const kills = p.kills ?? 0;
    const deaths = p.deaths ?? 0;
    const assists = p.assists ?? 0;
    const kdaValue = ((kills + assists) / Math.max(1, deaths));
    const damagePct = maxDamage > 0 ? Math.min(100, (damage / maxDamage) * 100) : 0;

    return (
        <div className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-white/5 transition-colors ${p.summonerName === 'Faker' ? 'bg-lol-gold/5 border border-lol-gold/20' : ''}`}>
            {/* Champ & Name */}
            <div className="col-span-4 lg:col-span-3 flex items-center gap-3 overflow-hidden">
                <div className="relative">
                    {champImg ? (
                        <Image src={champImg} width={32} height={32} className="w-8 h-8 rounded-lg border border-gray-700 object-cover" alt={champName} />
                    ) : (
                        <div className="w-8 h-8 rounded-lg border border-gray-700 bg-white/5 flex items-center justify-center text-xs font-bold text-gray-300">{(champName && typeof champName === 'string') ? champName.charAt(0) : '?'}</div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-black text-[8px] w-4 h-4 flex items-center justify-center rounded text-gray-400 border border-gray-800">{p.level ?? '-'}</div>
                </div>
                <div className="flex flex-col min-w-0">
                    <SafeLink
                        href={`/summoner/EUW/${encodeURIComponent(`${p.summonerName}-${p.tagLine || 'EUW'}`)}`}
                        className={`text-xs font-bold truncate ${p.summonerName === 'Faker' ? 'text-lol-gold' : 'text-gray-300'} hover:text-lol-gold`}
                    >
                        {p.summonerName ?? 'Unranked'}{p.tagLine ? `#${p.tagLine}` : ''}
                    </SafeLink>
                    <span className="text-[9px] text-gray-600">{p.rank || 'Unranked'}</span>
                </div>
            </div>

            {/* KDA & Badge */}
            <div className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center relative">
                <div className="text-xs text-gray-200 font-bold tracking-wider">{kills}/{deaths}/{assists}</div>
                <div className="text-[9px] text-gray-500 font-mono">{kdaValue.toFixed(2)}:1</div>
                {(() => {
                    if (isAce) return <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-purple-500/20 text-purple-400 border border-purple-500/50 text-[8px] px-1 rounded font-bold">ACE</div>;
                    if (isMvpGold) return <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-[8px] px-1 rounded font-bold">MVP</div>;
                    if (isMvpGrey) return <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gray-500/10 text-gray-300 border border-gray-500/30 text-[8px] px-1 rounded font-bold">MVP</div>;
                    return null;
                })()}
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
                <ParticipantItems items={itemsFiltered} />
                <ParticipantWard items={items} isWardItem={isWardItem} normalizeWardType={normalizeWardType} />
            </div>
        </div>
    );
};

export const ParticipantItems = ({ items }: { items: any[] }) => {
    const displayItems = [...items];
    while (displayItems.length < 6) {
        displayItems.push(null as any);
    }
    return (
        <>
            {displayItems.slice(0, 6).map((item, idx) => {
                if (!item || item.id === 0 || !item.imageUrl) {
                    return (<div key={idx} className="w-6 h-6 rounded bg-white/5 border border-white/10" />);
                }
                const action = (item as any).action;
                let title;
                if (item.name) title = item.name + (action ? ' (' + action + ')' : '');
                return (
                    <Image key={idx} src={item.imageUrl} width={24} height={24} className="w-6 h-6 rounded bg-[#121212] border border-white/10" alt={item.name || 'Item'} title={title} />
                );
            })}
        </>
    );
};

export const ParticipantWard = ({ items, isWardItem, normalizeWardType }: any) => {
    const wardItem = Array.isArray(items) ? items.find(isWardItem) : null;
    if (!wardItem) {
        return <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 ml-1"></div>;
    }
    const wardType = normalizeWardType(wardItem) || 'Ward';
    const getWardIcon = () => {
        if (wardItem?.imageUrl) {
            return <Image src={wardItem.imageUrl} width={16} height={16} className="w-4 h-4" alt={wardItem?.name || 'Ward'} />;
        }
        return <span>W</span>;
    };

    return (
        <div className="w-6 h-6 rounded-full bg-black border border-gray-700 ml-1 flex items-center justify-center text-[10px] font-bold text-gray-200" title={wardItem?.name || wardType}>
            {getWardIcon()}
        </div>
    );
};

const participantEquals = (a?: Participant | null, b?: Participant | null) => {
    if (!a || !b) return false;
    if (a.puuid && b.puuid) return a.puuid === b.puuid;
    if (a.participantId !== undefined && b.participantId !== undefined) return a.participantId === b.participantId;
    if (a.summonerName && b.summonerName) return a.summonerName === b.summonerName;
    return false;
};

interface TeamSectionProps {
    teamName: string;
    isWin: boolean;
    participants: any[];
    bestWinningByGold?: any;
    bestLosingByOp?: any;
    context: any;
}

export const TeamSection = ({ teamName, isWin, participants, bestWinningByGold, bestLosingByOp, context }: TeamSectionProps) => {
    return (
        <div className="flex flex-col gap-1">
            <div className={`text-xs font-bold px-2 mb-2 flex justify-between items-center ${isWin ? 'text-lol-win' : 'text-lol-loss'}`}>
                <span>{isWin ? 'VICTORY' : 'DEFEAT'}</span>
                <span className="text-gray-600 text-[10px] uppercase">{teamName}</span>
            </div>
            {participants.map((p: any, i: number) => {
                const isAce = !!p.ace || (Number(p.aceCount ?? 0) > 0);
                const isMvpGold = !!bestWinningByGold && participantEquals(p, bestWinningByGold);
                const isMvpGrey = !!bestLosingByOp && participantEquals(p, bestLosingByOp);

                return (
                    <ParticipantRow
                        key={i}
                        participant={p}
                        context={context}
                        badges={{
                            isAce,
                            isMvpGold,
                            isMvpGrey
                        }}
                    />
                );
            })}
        </div>
    );
};
