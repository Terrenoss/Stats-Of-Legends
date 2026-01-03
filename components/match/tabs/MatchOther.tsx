import React from 'react';
import { Participant } from '../../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface MatchOtherProps {
    me: Participant;
    participants: Participant[];
}

export const MatchOther: React.FC<MatchOtherProps> = ({ me, participants }) => {
    // Find direct opponent (same role, different team)
    // If role is undefined, fallback to same position index?
    // Riot API provides teamPosition.
    const opponent = participants.find(p => p.teamId !== me.teamId && p.teamPosition === me.teamPosition) || participants.find(p => p.teamId !== me.teamId);

    const myCs = (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0);
    const oppCs = (opponent && ((opponent.totalMinionsKilled || 0) + (opponent.neutralMinionsKilled || 0))) || 0;
    const oppVision = (opponent && opponent.visionScore) ? opponent.visionScore : 0;

    const rawData = [
        { name: 'Gold', Me: me.goldEarned || 0, Opponent: opponent?.goldEarned || 0 },
        { name: 'Damage', Me: me.totalDamageDealtToChampions || 0, Opponent: opponent?.totalDamageDealtToChampions || 0 },
        { name: 'CS', Me: myCs, Opponent: oppCs },
        { name: 'Vision', Me: me.visionScore || 0, Opponent: oppVision },
    ];

    const chartData = rawData.map(d => {
        const max = Math.max(d.Me, d.Opponent, 1); // Avoid division by zero
        return {
            ...d,
            MePct: (d.Me / max) * 100,
            OpponentPct: (d.Opponent / max) * 100,
            MeRaw: d.Me,
            OpponentRaw: d.Opponent
        };
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5 h-80">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Comparison vs Opponent ({opponent?.champion.name})</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#888" width={60} />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-black border border-gray-800 p-2 rounded text-xs">
                                            <p className="font-bold mb-1">{data.name}</p>
                                            <p className="text-blue-400">Me: {data.MeRaw.toLocaleString()}</p>
                                            <p className="text-red-400">Opponent: {data.OpponentRaw.toLocaleString()}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        <Bar dataKey="MePct" name="Me" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="OpponentPct" name="Opponent" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
