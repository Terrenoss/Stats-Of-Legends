import React, { useState } from 'react';
import Image from 'next/image';
import { Participant } from '../../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LegendScoreRadar } from '../../LegendScoreRadar';
import { getGradeColor } from '../../../utils/formatUtils';

interface MatchScoreProps {
    participants: Participant[];
    timelineData: any[];
    me?: Participant;
    averageRank?: string;
}

export const MatchScore: React.FC<MatchScoreProps> = ({ participants, timelineData, me, averageRank }) => {
    const [selectedPuuid, setSelectedPuuid] = useState<string>(me?.puuid || participants[0]?.puuid);
    const [comparePuuids, setComparePuuids] = useState<string[]>([]);
    const [comparisonMode, setComparisonMode] = useState<'CHAMPION' | 'TIER'>('CHAMPION');

    const winningTeam = participants.filter(p => p.win).sort((a, b) => (b.legendScore || 0) - (a.legendScore || 0));
    const losingTeam = participants.filter(p => !p.win).sort((a, b) => (b.legendScore || 0) - (a.legendScore || 0));

    const zToScore = (z?: number) => {
        if (z === undefined) return 50;
        return Math.max(0, Math.min(100, 50 + (z * 20)));
    };

    const selectedPlayer = participants.find(p => p.puuid === selectedPuuid) || participants[0];

    const COLORS = ['#3b82f6', '#ef4444', '#eab308', '#10b981', '#8b5cf6', '#f97316', '#ec4899'];

    const playerStats = {
        combat: zToScore(selectedPlayer.legendScoreBreakdown?.damage),
        objectives: zToScore(selectedPlayer.legendScoreBreakdown?.objective),
        vision: zToScore(selectedPlayer.legendScoreBreakdown?.vision),
        farming: zToScore(selectedPlayer.legendScoreBreakdown?.cs),
        survival: zToScore(selectedPlayer.legendScoreBreakdown?.kda),
        aggressiveness: zToScore(selectedPlayer.legendScoreBreakdown?.lane)
    };

    const comparisons = [];

    // Tier/Role Average Comparison
    if (comparisonMode === 'TIER' && selectedPlayer.roleAveragePerformance) {
        comparisons.push({
            name: `Avg ${averageRank} (${selectedPlayer.teamPosition})`,
            stats: {
                combat: zToScore(selectedPlayer.roleAveragePerformance.damage),
                objectives: zToScore(selectedPlayer.roleAveragePerformance.objective),
                vision: zToScore(selectedPlayer.roleAveragePerformance.vision),
                farming: zToScore(selectedPlayer.roleAveragePerformance.cs),
                survival: zToScore(selectedPlayer.roleAveragePerformance.kda),
                aggressiveness: 50
            },
            color: '#a855f7' // Purple
        });
    }

    // Player Comparisons
    comparePuuids.forEach((pid, idx) => {
        const p = participants.find(part => part.puuid === pid);
        if (p) {
            comparisons.push({
                name: p.champion.name,
                stats: {
                    combat: zToScore(p.legendScoreBreakdown?.damage),
                    objectives: zToScore(p.legendScoreBreakdown?.objective),
                    vision: zToScore(p.legendScoreBreakdown?.vision),
                    farming: zToScore(p.legendScoreBreakdown?.cs),
                    survival: zToScore(p.legendScoreBreakdown?.kda),
                    aggressiveness: zToScore(p.legendScoreBreakdown?.lane)
                },
                color: COLORS[idx % COLORS.length]
            });
        }
    });

    const avgLabel = comparisonMode === 'TIER' && averageRank
        ? `Avg ${averageRank} (${selectedPlayer.teamPosition})`
        : `Avg ${selectedPlayer.champion.name} (${averageRank || 'Global'})`;

    const toggleComparison = (puuid: string) => {
        if (comparePuuids.includes(puuid)) {
            setComparePuuids(prev => prev.filter(id => id !== puuid));
        } else {
            setComparePuuids(prev => [...prev, puuid]);
        }
    };

    return (
        <div className="bg-[#121212] rounded-xl p-6 border border-white/5 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Radar Chart Section */}
                <div className="md:col-span-1 flex flex-col items-center justify-center relative">
                    {/* Comparison Controls */}
                    <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                        {/* Toggle for Champion vs Rank comparison */}
                        <div className="flex bg-black/50 rounded-lg p-1 border border-white/10 backdrop-blur-sm mt-1">
                            <button
                                onClick={() => setComparisonMode('CHAMPION')}
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded transition-all ${comparisonMode === 'CHAMPION'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Champion
                            </button>
                            <button
                                onClick={() => setComparisonMode('TIER')}
                                className={`flex-1 px-3 py-1.5 text-[10px] font-bold rounded transition-all ${comparisonMode === 'TIER'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Rank
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-12 md:mt-0">
                        {/* Grade Display */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-0">
                            <div className={`text-4xl font-black font-display ${getGradeColor(selectedPlayer.legendScoreGrade).split(' ')[0].replace('bg-', 'text-').replace('border', '')}`}>
                                {selectedPlayer.legendScoreGrade}
                            </div>
                            <div className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                <span>Legend Score: {selectedPlayer.legendScore?.toFixed(0)} <span className="text-[10px]">/ 100</span></span>
                                {selectedPlayer.legendScoreSampleSize !== undefined && selectedPlayer.legendScoreSampleSize < 10 && (
                                    <div className="group relative pointer-events-auto">
                                        <span className="text-yellow-500 cursor-help">⚠️</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 text-gray-300 text-[10px] p-2 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            Low sample size ({selectedPlayer.legendScoreSampleSize} matches). Score may be less accurate.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 relative">
                    {/* Hint for interaction */}
                    <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] text-gray-500 bg-black/40 px-2 py-1 rounded-full border border-white/5 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span>Click player below to compare</span>
                    </div>

                    <LegendScoreRadar
                        playerStats={playerStats}
                        comparisons={comparisons}
                        averageLabel={avgLabel}
                    // Average is implicitly 50 in our Z-score mapping
                    />
                </div>
            </div >

            {/* Score Cards */}
            < div className="grid grid-cols-1 md:grid-cols-2 gap-8" >
                <div>
                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-4 flex justify-between items-center">
                        <span>Winning Team</span>
                        <span className="text-[10px] font-normal text-gray-600 normal-case">Click to compare</span>
                    </h4>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {winningTeam.map((p, i) => {
                            const isSelected = selectedPuuid === p.puuid;
                            const isComparison = comparePuuids.includes(p.puuid);
                            const compIndex = comparePuuids.indexOf(p.puuid);
                            const ringColor = isComparison ? COLORS[compIndex % COLORS.length] : 'transparent';

                            return (
                                <div key={i}
                                    className={`flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110 
                                        ${isSelected ? 'ring-2 ring-white rounded-lg scale-105' : ''}
                                    `}
                                    style={{
                                        boxShadow: isComparison ? `0 0 0 2px ${ringColor}` : 'none',
                                        borderRadius: '0.5rem',
                                        transform: isComparison || isSelected ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                    onClick={() => {
                                        if (isSelected) return;
                                        toggleComparison(p.puuid);
                                    }}
                                >
                                    <div className="relative">
                                        <Image src={p.champion.imageUrl} width={40} height={40} className="w-10 h-10 rounded-lg border border-blue-500/30" alt={p.champion.name} />
                                        <div
                                            className={`absolute -bottom-2 -right-2 ${getGradeColor(p.legendScoreGrade)} text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md flex gap-1 items-center`}
                                        >
                                            <span>{p.legendScoreGrade || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase mb-4">Losing Team</h4>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {losingTeam.map((p, i) => {
                            const isSelected = selectedPuuid === p.puuid;
                            const isComparison = comparePuuids.includes(p.puuid);
                            const compIndex = comparePuuids.indexOf(p.puuid);
                            const ringColor = isComparison ? COLORS[compIndex % COLORS.length] : 'transparent';

                            return (
                                <div key={i}
                                    className={`flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110 
                                        ${isSelected ? 'ring-2 ring-white rounded-lg scale-105' : ''}
                                    `}
                                    style={{
                                        boxShadow: isComparison ? `0 0 0 2px ${ringColor}` : 'none',
                                        borderRadius: '0.5rem',
                                        transform: isComparison || isSelected ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                    onClick={() => {
                                        if (isSelected) return;
                                        toggleComparison(p.puuid);
                                    }}
                                >
                                    <div className="relative">
                                        <Image src={p.champion.imageUrl} width={40} height={40} className="w-10 h-10 rounded-lg border border-red-500/30" alt={p.champion.name} />
                                        <div
                                            className={`absolute -bottom-2 -right-2 ${getGradeColor(p.legendScoreGrade)} text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md flex gap-1 items-center`}
                                        >
                                            <span>{p.legendScoreGrade || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div >

            {/* Graph */}
            < div className="h-64 bg-[#121212] rounded-xl p-4 border border-white/5 mt-4" >
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Team Gold Advantage</h4>
                {
                    timelineData && timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="timestamp" stroke="#666" fontSize={10} />
                                <YAxis stroke="#666" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="blueScore" stroke="#3b82f6" strokeWidth={2} dot={false} name="Blue Gold" />
                                <Line type="monotone" dataKey="redScore" stroke="#ef4444" strokeWidth={2} dot={false} name="Red Gold" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-xs">No timeline data available</div>
                    )
                }
            </div >
        </div >
    );
};
