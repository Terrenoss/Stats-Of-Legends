
import React from 'react';
import { HeatmapDay } from '../types';
import { TRANSLATIONS } from '../constants';

interface ActivityHeatmapProps {
  data: HeatmapDay[];
  lang: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, lang }) => {
  // Ensure we have exactly 120 days or simpler slice
  const days = data.slice(0, 119); 
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  const getColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-[#1a1a1a] border border-white/5';
      case 1: return 'bg-lol-loss/30 border border-lol-loss/50'; // Bad
      case 2: return 'bg-lol-loss border border-lol-loss'; // Terrible
      case 3: return 'bg-teal-500/50 border border-teal-500'; // Good
      case 4: return 'bg-teal-400 border border-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]'; // Great
      default: return 'bg-[#1a1a1a]';
    }
  };

  return (
    <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl">
       <div className="flex justify-between items-end mb-4">
         <h3 className="text-gray-400 text-xs uppercase font-bold tracking-widest">{t.recentActivity} <span className="text-[#555] ml-2">Last 120 Days</span></h3>
       </div>
       
       <div className="flex gap-2 text-[10px] text-gray-500 font-mono mb-2 ml-8">
          <span>Aug</span>
          <span className="ml-8">Sep</span>
          <span className="ml-8">Oct</span>
          <span className="ml-8">Nov</span>
       </div>

       <div className="flex gap-2">
         <div className="flex flex-col gap-1 text-[10px] text-gray-600 font-mono leading-[10px]">
           <span>Sun</span>
           <span>Mon</span>
           <span>Tue</span>
           <span>Wed</span>
           <span>Thu</span>
           <span>Fri</span>
           <span>Sat</span>
         </div>
         
         <div className="grid grid-rows-7 grid-flow-col gap-1">
           {days.map((day, i) => (
             <div 
               key={i} 
               className={`w-2.5 h-2.5 rounded-sm ${getColor(day.intensity)}`}
               title={`${new Date(day.date).toLocaleDateString()}: ${day.games} games (${day.wins}W-${day.losses}L)`}
             ></div>
           ))}
         </div>
       </div>

       <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-gray-400 font-bold">
          <div className="flex gap-4">
            <span><span className="text-white">530</span> games played</span>
            <span><span className="text-white">262</span> hours played</span>
          </div>
          
          <div className="flex items-center gap-2">
             <span>{t.badDay}</span>
             <div className="w-2.5 h-2.5 rounded-sm bg-lol-loss"></div>
             <div className="w-2.5 h-2.5 rounded-sm bg-[#1a1a1a] border border-white/5 mx-1"></div>
             <div className="w-2.5 h-2.5 rounded-sm bg-teal-400"></div>
             <span>{t.goodDay}</span>
          </div>
       </div>
    </div>
  );
};
