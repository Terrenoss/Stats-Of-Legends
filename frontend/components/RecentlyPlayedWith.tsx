import React from 'react';
import { Teammate } from '../types';
import { TRANSLATIONS } from '../constants';

interface RecentlyPlayedWithProps {
  teammates: Teammate[];
  lang: string;
  patch?: string;
}

export const RecentlyPlayedWith: React.FC<RecentlyPlayedWithProps> = ({ teammates, lang, patch }) => {
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

  return (
    <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-5 shadow-xl">
      <h3 className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4">{t.recentlyPlayedWith}</h3>
      <div className="space-y-4">
        {teammates.map((teammate, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition">
            <div className="flex items-center gap-3">
              <div className="relative">
                 <img 
                   src={`https://ddragon.leagueoflegends.com/cdn/${patch || '15.23.1'}/img/profileicon/${teammate.profileIconId}.png`} 
                   className="w-8 h-8 rounded-lg border border-gray-700 group-hover:border-lol-gold transition" 
                   alt="Icon" 
                 />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-300 group-hover:text-white font-bold max-w-[100px] truncate">{teammate.name}</span>
                <span className="text-[10px] text-gray-600 font-mono">#{teammate.tag}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="font-bold text-gray-400 text-xs">
                 <span className={`${teammate.winrate >= 50 ? 'text-lol-win' : 'text-lol-loss'}`}>{teammate.winrate}%</span> ({teammate.wins}W-{teammate.losses}L)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
