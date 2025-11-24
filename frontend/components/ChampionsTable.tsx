
import React, { useState } from 'react';
import { DetailedChampionStats } from '../types';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ChampionsTableProps {
  champions: DetailedChampionStats[];
  lang: string;
}

export const ChampionsTable: React.FC<ChampionsTableProps> = ({ champions, lang }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof DetailedChampionStats; direction: 'asc' | 'desc' }>({ key: 'games', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  const sortedChamps = [...champions]
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: keyof DetailedChampionStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof DetailedChampionStats }) => {
    if (sortConfig.key !== column) return <div className="w-3 h-3 opacity-0"></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Sidebar Filters */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4">
           <div className="text-xs font-bold text-lol-gold uppercase tracking-widest mb-3 px-2">Season 2025</div>
           <div className="space-y-1">
             {['All Ranked', 'Ranked Solo', 'Ranked Flex', 'Normal'].map((filter, i) => (
               <div key={i} className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${i === 0 ? 'bg-lol-gold text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                 {filter}
               </div>
             ))}
           </div>
        </div>
        
        <div className="bg-[#121212] border border-white/5 rounded-[1.5rem] p-4">
            <div className="relative">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
               <input 
                 type="text" 
                 placeholder="Search champion..." 
                 className="w-full bg-[#080808] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:border-lol-gold outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="col-span-12 lg:col-span-9 bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-[10px] uppercase text-gray-500 font-bold border-b border-white/5 bg-[#18181b]">
                 <th className="p-4 text-center w-10">#</th>
                 <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Champion <SortIcon column="name"/></th>
                 <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('games')}>Games <SortIcon column="games"/></th>
                 <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('wins')}>Win/Lose (WR) <SortIcon column="wins"/></th>
                 <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('kda')}>KDA <SortIcon column="kda"/></th>
                 <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('dmgPerMinute')}>DMG/M <SortIcon column="dmgPerMinute"/></th>
                 <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('csPerMinute')}>CS/M <SortIcon column="csPerMinute"/></th>
                 <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('gd15')}>GD@15 <SortIcon column="gd15"/></th>
               </tr>
             </thead>
             <tbody className="text-sm font-medium text-gray-300 divide-y divide-white/5">
               {sortedChamps.map((champ, index) => (
                 <tr key={champ.id} className="hover:bg-white/5 transition-colors group">
                   <td className="p-4 text-center text-gray-600 font-mono">{index + 1}</td>
                   <td className="p-4">
                      <div className="flex items-center gap-3">
                         <img src={champ.imageUrl} className="w-8 h-8 rounded-lg border border-gray-700 group-hover:border-lol-gold" alt={champ.name} />
                         <span className="font-bold text-white group-hover:text-lol-gold transition-colors">{champ.name}</span>
                      </div>
                   </td>
                   <td className="p-4 text-center">
                     <div className="text-white">{champ.games}</div>
                   </td>
                   <td className="p-4">
                     <div className="flex flex-col gap-1 w-32">
                        <div className="flex text-[10px] justify-between text-gray-400">
                           <span>{Math.round((champ.wins/champ.games)*100)}%</span>
                           <span>{champ.wins}W - {champ.losses}L</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#333] rounded-full overflow-hidden flex">
                           <div style={{ width: `${(champ.wins/champ.games)*100}%` }} className="h-full bg-lol-win"></div>
                        </div>
                     </div>
                   </td>
                   <td className="p-4 text-center">
                      <div className={`font-bold ${champ.kda > 3 ? 'text-lol-gold' : 'text-white'}`}>{champ.kda.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-500">({champ.kills}/{champ.deaths}/{champ.assists})</div>
                   </td>
                   <td className="p-4 text-center font-mono text-xs">{champ.dmgPerMinute}</td>
                   <td className="p-4 text-center font-mono text-xs">{champ.csPerMinute}</td>
                   <td className={`p-4 text-center font-mono text-xs font-bold ${champ.gd15 > 0 ? 'text-lol-win' : 'text-lol-loss'}`}>
                      {champ.gd15 > 0 ? '+' : ''}{champ.gd15}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};
