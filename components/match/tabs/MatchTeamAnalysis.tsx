import React from 'react';
import Image from 'next/image';
import { Participant } from '../../../types';

interface MatchTeamAnalysisProps {
    participants: Participant[];
    maxDamage: number;
    maxTaken: number;
}

export const MatchTeamAnalysis: React.FC<MatchTeamAnalysisProps> = ({ participants, maxDamage, maxTaken }) => {
    const team100 = participants.filter(p => p.teamId === 100);
    const team200 = participants.filter(p => p.teamId === 200);

    const StatBlock = ({ title, getValue, formatValue, maxVal }: { title: string, getValue: (p: Participant) => number, formatValue?: (v: number) => string, maxVal?: number }) => {
        const t100Total = team100.reduce((a, b) => a + getValue(b), 0);
        const t200Total = team200.reduce((a, b) => a + getValue(b), 0);
        const total = t100Total + t200Total;
        const t100Pct = total > 0 ? (t100Total / total) * 100 : 50;

        // Local max for bars if not provided
        const localMax = maxVal || Math.max(...participants.map(getValue));

        return (
            <div className="bg-[#121212] rounded-xl p-4 border border-white/5">
                <h4 className="text-center text-xs font-bold text-gray-400 uppercase mb-4">{title}</h4>

                <div className="flex justify-between items-center gap-4">
                    {/* Team 100 (Blue) */}
                    <div className="flex-1 flex flex-col gap-1">
                        {team100.map((p, i) => (
                            <div key={i} className="flex items-center justify-end gap-2 h-6">
                                <span className="text-[10px] text-gray-500 truncate w-12 text-right">{p.champion.name}</span>
                                <div className="flex-1 h-2 bg-gray-800 rounded-l-full flex justify-end">
                                    <div style={{ width: `${(getValue(p) / localMax) * 100}%` }} className="h-full bg-blue-500 rounded-l-full"></div>
                                </div>
                                <span className="text-[10px] text-gray-300 w-8 text-right">{formatValue ? formatValue(getValue(p)) : getValue(p)}</span>
                                <Image src={p.champion.imageUrl} width={24} height={24} className="w-6 h-6 rounded border border-gray-700" alt={p.champion.name} />
                            </div>
                        ))}
                    </div>

                    {/* Center Donut/Total */}
                    <div className="w-24 flex flex-col items-center justify-center relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-r-red-500 border-b-red-500 rotate-45 flex items-center justify-center bg-[#0e0e0e]">
                            <div className="flex flex-col items-center -rotate-45">
                                <span className="text-blue-400 text-xs font-bold">{formatValue ? formatValue(t100Total) : t100Total}</span>
                                <span className="text-red-400 text-xs font-bold">{formatValue ? formatValue(t200Total) : t200Total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Team 200 (Red) */}
                    <div className="flex-1 flex flex-col gap-1">
                        {team200.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 h-6">
                                <Image src={p.champion.imageUrl} width={24} height={24} className="w-6 h-6 rounded border border-gray-700" alt={p.champion.name} />
                                <span className="text-[10px] text-gray-300 w-8">{formatValue ? formatValue(getValue(p)) : getValue(p)}</span>
                                <div className="flex-1 h-2 bg-gray-800 rounded-r-full">
                                    <div style={{ width: `${(getValue(p) / localMax) * 100}%` }} className="h-full bg-red-500 rounded-r-full"></div>
                                </div>
                                <span className="text-[10px] text-gray-500 truncate w-12">{p.champion.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatBlock title="Kills" getValue={(p) => p.kills} />
            <StatBlock title="Gold" getValue={(p) => p.goldEarned || 0} formatValue={(v) => (v / 1000).toFixed(1) + 'k'} />
            <StatBlock title="Damage Dealt" getValue={(p) => p.totalDamageDealtToChampions} formatValue={(v) => (v / 1000).toFixed(1) + 'k'} maxVal={maxDamage} />
            <StatBlock title="Damage Taken" getValue={(p) => p.totalDamageTaken || 0} formatValue={(v) => (v / 1000).toFixed(1) + 'k'} maxVal={maxTaken} />
            <StatBlock title="Vision Score" getValue={(p) => p.visionScore || 0} />
            <StatBlock title="CS" getValue={(p) => (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)} />
        </div>
    );
};
