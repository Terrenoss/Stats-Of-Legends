import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Match } from '../types';
import { TRANSLATIONS } from '../constants';

interface WinrateSummaryProps {
    matches: Match[];
    lang: string;
}

export const WinrateSummary: React.FC<WinrateSummaryProps> = ({ matches, lang }) => {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

    // Fallback de sécurité : toujours travailler sur un tableau
    const safeMatches: Match[] = Array.isArray(matches) ? matches : [];

    const recentMatches = safeMatches.slice(0, 20);
    const wins = recentMatches.filter(m => m.me.win).length;
    const losses = recentMatches.length - wins;
    const winrate = recentMatches.length > 0 ? Math.round((wins / recentMatches.length) * 100) : 0;

    const totalKills = recentMatches.reduce((acc, m) => acc + m.me.kills, 0);
    const totalDeaths = recentMatches.reduce((acc, m) => acc + m.me.deaths, 0);
    const totalAssists = recentMatches.reduce((acc, m) => acc + m.me.assists, 0);
    
    const avgKills = (totalKills / Math.max(1, recentMatches.length)).toFixed(1);
    const avgDeaths = (totalDeaths / Math.max(1, recentMatches.length)).toFixed(1);
    const avgAssists = (totalAssists / Math.max(1, recentMatches.length)).toFixed(1);
    
    const kda = ((totalKills + totalAssists) / Math.max(1, totalDeaths)).toFixed(2);
    const avgScore = 72; // Mock avg OP score

    const data = [
        { name: 'Wins', value: wins },
        { name: 'Losses', value: losses },
    ];

    const COLORS = ['#3b82f6', '#ef4444']; // Blue / Red to match screenshot

    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-4 flex items-center justify-between mb-4 shadow-xl">
             {/* Donut Chart */}
             <div className="relative w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={30}
                            outerRadius={40}
                            paddingAngle={0}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lol-blue text-sm">
                   <span className="text-blue-400">{winrate}%</span>
                </div>
             </div>

             {/* Stats Text */}
             <div className="flex flex-col items-center">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wide bg-white/5 px-2 py-0.5 rounded mb-1">{t.recent20Games}</div>
                 <div className="text-gray-500 text-xs">{wins}V {losses}D</div>
             </div>

             <div className="flex flex-col items-center">
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wide bg-white/5 px-2 py-0.5 rounded mb-1">{kda} KDA</div>
                 <div className="text-gray-500 text-xs">{avgKills} / <span className="text-lol-red">{avgDeaths}</span> / {avgAssists}</div>
             </div>
             
             <div className="flex flex-col items-center pr-4">
                 <div className="text-teal-400 text-xl font-black">{avgScore}</div>
                 <div className="text-gray-500 text-[10px] uppercase font-bold">AI-Score</div>
             </div>
        </div>
    );
};
