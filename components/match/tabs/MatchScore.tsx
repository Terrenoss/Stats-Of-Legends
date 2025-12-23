import React from 'react';
import { Participant } from '../../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MatchScoreProps {
    participants: Participant[];
    timelineData: any[];
}

export const MatchScore: React.FC<MatchScoreProps> = ({ participants, timelineData }) => {
    // Calculate Scores (0-10)
    // Simple heuristic: KDA, CS/m, DPM, Vision, KP
    const calculateScore = (p: Participant) => {
        let score = 5.0; // Base
        const kda = (p.kills + p.assists) / Math.max(1, p.deaths);
        score += (kda - 3) * 0.5;
        if (p.win) score += 1;
        if (p.deaths === 0) score += 1;
        if (p.pentaKills) score += 2;
        if (p.quadraKills) score += 1;

        // Cap 0-10
        return Math.min(10, Math.max(0, score)).toFixed(1);
    };

    const scoredParticipants = participants.map(p => ({ ...p, score: calculateScore(p) }));
    const winningTeam = scoredParticipants.filter(p => p.win).sort((a, b) => Number(b.score) - Number(a.score));
    const losingTeam = scoredParticipants.filter(p => !p.win).sort((a, b) => Number(b.score) - Number(a.score));

    return (
        <div className="flex flex-col gap-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-xs font-bold text-blue-400 uppercase mb-4">Winning Team</h4>
                    <div className="flex gap-2 justify-center">
                        {winningTeam.map((p, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <img src={p.champion.imageUrl} className="w-10 h-10 rounded-lg border border-blue-500/30" />
                                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1 rounded">{p.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase mb-4">Losing Team</h4>
                    <div className="flex gap-2 justify-center">
                        {losingTeam.map((p, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className="relative">
                                    <img src={p.champion.imageUrl} className="w-10 h-10 rounded-lg border border-red-500/30" />
                                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1 rounded">{p.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Graph */}
            <div className="h-64 bg-[#121212] rounded-xl p-4 border border-white/5 mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Team Gold Advantage</h4>
                {timelineData && timelineData.length > 0 ? (
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
                )}
            </div>
        </div>
    );
};
