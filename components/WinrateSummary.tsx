"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Match, Language } from '../types';
import { useI18n } from '../app/LanguageContext';

interface WinrateSummaryProps {
    matches: Match[];
    lang?: Language;
}

export const WinrateSummary: React.FC<WinrateSummaryProps> = ({ matches, lang }) => {
    const { t } = useI18n();
    const translations = lang ? (require('../constants').TRANSLATIONS as any)[lang] : t;

    const recentMatches = matches.slice(0, 20);
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

    const COLORS = ['#059669', '#991B1B']; // Matching the theme colors (Emerald/Deep Red)

    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 flex items-center justify-between mb-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

             {/* Donut Chart */}
             <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={36}
                            outerRadius={48}
                            paddingAngle={4}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className={`text-xl font-bold font-display ${winrate >= 50 ? 'text-lol-win' : 'text-lol-loss'}`}>{winrate}%</span>
                   <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Winrate</span>
                </div>
             </div>

             {/* Stats Text */}
             <div className="flex flex-col items-center gap-1">
                 <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full mb-1">{translations.recent20Games}</div>
                 <div className="text-gray-300 font-bold text-sm">{wins}W - {losses}L</div>
             </div>

             <div className="flex flex-col items-center gap-0.5">
                 <div className="text-lol-gold text-lg font-bold">{kda} <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">KDA</span></div>
                 <div className="text-gray-400 text-xs font-mono">{avgKills} / <span className="text-lol-red">{avgDeaths}</span> / {avgAssists}</div>
             </div>
             
             <div className="flex flex-col items-center pr-4">
                 <div className="text-teal-400 text-2xl font-black drop-shadow-lg">{avgScore}</div>
                 <div className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">AI Score</div>
             </div>
        </div>
    );
};