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

    const data = [
        { name: 'Gold', Me: me.goldEarned, Opponent: opponent?.goldEarned || 0 },
        { name: 'Damage', Me: me.totalDamageDealtToChampions, Opponent: opponent?.totalDamageDealtToChampions || 0 },
        { name: 'CS', Me: (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0), Opponent: (opponent?.totalMinionsKilled || 0) + (opponent?.neutralMinionsKilled || 0) },
        { name: 'Vision', Me: me.visionScore, Opponent: opponent?.visionScore || 0 },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5 h-80">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Comparison vs Opponent ({opponent?.champion.name})</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#888" width={60} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        <Bar dataKey="Me" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="Opponent" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
