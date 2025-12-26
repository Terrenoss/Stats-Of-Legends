import React from 'react';
import Image from 'next/image';
import { getGradeColor } from '@/utils/formatUtils';

interface MatchInfoProps {
    details: {
        isWin: boolean;
        durationMin: number;
        durationSec: number;
    };
    utils: {
        getQueueLabel: () => string;
        getTimeAgo: () => string;
        t: any;
    };
}

export const MatchInfo = ({ details, utils }: MatchInfoProps) => (
    <div className="w-full md:w-28 flex flex-col gap-0.5">
        <span className={`font-bold font-display uppercase tracking-wider text-[9px] ${details.isWin ? 'text-lol-win' : 'text-gray-600'}`}>
            {utils.getQueueLabel()}
        </span>
        <span className="text-[9px] text-gray-600 font-bold">{utils.getTimeAgo()}</span>
        <span className={`font-black text-lg tracking-tight ${details.isWin ? 'text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-gray-500'}`}>{details.isWin ? utils.t.win : utils.t.loss}</span>
        <span className="text-[10px] text-gray-600 font-mono">{details.durationMin}m {details.durationSec}s</span>
    </div>
);

export const ChampionInfo = ({ isWin, champName, me, spells, getChampionIconUrl }: any) => (
    <div className="flex gap-3 items-center">
        <div className="relative group">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg ${isWin ? 'border-lol-win' : 'border-lol-loss'}`}>
                <Image
                    src={getChampionIconUrl(champName)}
                    alt={champName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform"
                />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#0a0a0a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20">
                {me.champLevel}
            </div>
        </div>
        <div className="flex flex-col gap-1">
            {spells.map((spell: any, idx: number) => (
                <Image key={spell.id || idx} src={spell.imageUrl} alt={spell.name ?? ''} width={24} height={24} className="w-6 h-6 md:w-7 md:h-7 rounded-md border border-white/10 bg-[#121212]" />
            ))}
        </div>
        <div className="flex flex-col gap-1">
            {me?.runes?.primary ? (
                <Image src={me.runes.primary} alt="Keystone" width={24} height={24} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-lol-gold/50 object-cover" />
            ) : (
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-lol-gold/50 flex items-center justify-center text-[10px] font-bold text-lol-gold">R</div>
            )}
            {me?.runes?.secondary ? (
                <Image src={me.runes.secondary} alt="Secondary Rune" width={24} height={24} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-gray-700 object-cover p-1" />
            ) : (
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-black border border-gray-700 flex items-center justify-center text-[10px] text-gray-400">S</div>
            )}
        </div>
    </div>
);

interface KDAInfoProps {
    stats: {
        kills: number;
        deaths: number;
        assists: number;
        kda: string;
    };
    context: {
        isWin: boolean;
        match: any;
        me: any;
    };
}

export const KDAInfo = ({ stats, context }: KDAInfoProps) => (
    <div className="flex flex-col items-center w-32 relative">
        {/* MVP Badge Logic */}
        {(() => {
            const myScore = context.me.legendScore || 0;
            const maxScore = Math.max(...(context.match.participants || []).map((p: any) => p.legendScore || 0));
            const isMvp = myScore > 0 && myScore === maxScore;

            if (isMvp && context.isWin) {
                return (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-t-lg shadow-[0_-2px_10px_rgba(255,215,0,0.5)] z-20 animate-pulse">
                        MVP
                    </div>
                );
            }
            return null;
        })()}

        <div className="text-xl font-display font-black text-white tracking-widest">
            {stats.kills} <span className="text-gray-500 text-sm">/</span> <span className="text-lol-red">{stats.deaths}</span> <span className="text-gray-500 text-sm">/</span> {stats.assists}
        </div>
        <div className={`text-xs font-mono mt-0.5 font-bold ${Number(stats.kda) >= 5 ? 'text-orange-500 animate-burn font-black' : Number(stats.kda) >= 4 ? 'text-lol-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : Number(stats.kda) >= 3 ? 'text-blue-400' : 'text-gray-400'}`}>
            {stats.kda} KDA
        </div>
        <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">P/Kill {Math.round(((stats.kills + stats.assists) / Math.max(1, (context.isWin ? context.match.participants.filter((p: any) => p.win) : context.match.participants.filter((p: any) => !p.win)).reduce((a: any, b: any) => a + b.kills, 0))) * 100)}%</div>
    </div>
);

export const ItemsList = ({ me }: any) => (
    <div className="grid grid-cols-4 gap-1 max-w-[120px]">
        {(() => {
            const rawItems = Array.isArray(me?.items) ? me.items : [];
            const safeItems = [...rawItems];
            while (safeItems.length < 7) safeItems.push({ id: 0, name: '', imageUrl: '' });

            const orderedItems = [
                safeItems[0], safeItems[1], safeItems[2], safeItems[6],
                safeItems[3], safeItems[4], safeItems[5]
            ];

            return orderedItems.map((item, idx) => (
                item?.id && item.id !== 0 ? (
                    <Image key={`item-${idx}`} src={item.imageUrl} alt={item.name ?? ''} width={24} height={24} className={`w-6 h-6 rounded-md bg-[#121212] border border-white/10 ${idx === 3 ? 'rounded-full' : ''}`} title={item.name ?? ''} />
                ) : (
                    <div key={`empty-${idx}`} className="w-6 h-6 rounded-md bg-white/5 border border-white/5"></div>
                )
            ));
        })()}
    </div>
);

export const MatchCardTabs = ({ activeTab, setActiveTab }: any) => (
    <div className="flex border-t border-white/5 bg-[#121212]">
        <button onClick={() => setActiveTab('SUMMARY')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'SUMMARY' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Vue d'ensemble</button>
        <button onClick={() => setActiveTab('SCORE')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'SCORE' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Legend Score</button>
        <button onClick={() => setActiveTab('TEAM')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'TEAM' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Analyse d'équipe</button>
        <button onClick={() => setActiveTab('BUILD')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'BUILD' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Build</button>
        <button onClick={() => setActiveTab('OTHER')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'OTHER' ? 'text-white border-white bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>Autre</button>
    </div>
);

export const LegendScoreBadge = ({ me }: any) => (
    <div className="flex flex-col items-center justify-center w-16 hidden md:flex relative group">
        <div className={`text-xl font-black font-display ${getGradeColor(me.legendScoreGrade)}`}>
            {me.legendScoreGrade || '-'}
        </div>
        <div className="text-[10px] text-gray-500 font-bold">
            {me.legendScore?.toFixed(0) || '-'} <span className="text-[8px]">/ 100</span>
        </div>

        {/* V2: Confidence & Contribution Tooltip/Badge */}
        {(me.legendScoreSampleSize !== undefined && me.legendScoreSampleSize < 10) && (
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-500 rounded-full border border-black" title="Low Sample Size (<10 matches) - Score may be volatile"></div>
        )}
        {me.legendScoreContribution !== undefined && me.legendScoreContribution > 0.01 && (
            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">+{Math.round(me.legendScoreContribution * 100)}% Win</div>
        )}
    </div>
);
