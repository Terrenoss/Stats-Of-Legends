import React, { useState } from 'react';
import { ChevronDown, Search, Plus, X, Undo, Redo, RotateCcw, Brain, Loader2 } from 'lucide-react';
import { Champion, Item } from '../../types';

interface BuilderGridProps {
  selectedItems: (Item | null)[];
  setSelectedItems: (items: (Item | null)[]) => void;
  currentChampion: Champion | null;
  setCurrentChampion: (champ: Champion) => void;
  champions: Champion[];
  championLevel: number;
  setChampionLevel: (lvl: number) => void;
  spellLevels: {[key: string]: number};
  setSpellLevels: React.Dispatch<React.SetStateAction<{[key: string]: number}>>;
  history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; reset: () => void };
  onAnalyze: () => void;
  isAnalyzing: boolean;
  aiAnalysis: string | null;
  t: any;
}

export const BuilderGrid: React.FC<BuilderGridProps> = ({ 
  selectedItems, setSelectedItems, currentChampion, setCurrentChampion, champions, 
  championLevel, setChampionLevel, spellLevels, setSpellLevels, 
  history, onAnalyze, isAnalyzing, aiAnalysis, t 
}) => {
  const [isChampSelectOpen, setIsChampSelectOpen] = useState(false);
  const [champSearchQuery, setChampSearchQuery] = useState('');

  const filteredChampions = champions.filter(champ =>
    champ.name.toLowerCase().includes(champSearchQuery.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, source: 'slot', index: number) => {
    e.dataTransfer.setData('sourceType', source);
    e.dataTransfer.setData('slotIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const newItems = [...selectedItems];

    if (sourceType === 'slot') {
      const sourceIndex = parseInt(e.dataTransfer.getData('slotIndex'));
      const temp = newItems[targetIndex];
      newItems[targetIndex] = newItems[sourceIndex];
      newItems[sourceIndex] = temp;
    }
    setSelectedItems(newItems);
  };

  const handleSpellLevelChange = (spellKey: string, delta: number, max: number) => {
    setSpellLevels(prev => {
      const current = prev[spellKey] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [spellKey]: next };
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems[index] = null;
    setSelectedItems(newItems);
  };

  return (
    <div className="lg:col-span-6 flex flex-col gap-6">
        {/* Champion Selection Header */}
        <div className="relative z-20">
            <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 relative shadow-2xl">
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                 <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-lol-gold/5 to-transparent"></div>
              </div>
              
              <div className="flex items-center gap-8 relative z-10">
                <div className="relative cursor-pointer group" onClick={() => setIsChampSelectOpen(!isChampSelectOpen)}>
                  <div className="absolute -inset-2 bg-lol-gold rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                  {currentChampion && (
                    <img src={currentChampion.imageUrl} alt={currentChampion.name} className="relative w-28 h-28 rounded-full border-4 border-[#121212] ring-2 ring-lol-gold shadow-2xl transition-transform group-hover:scale-105 object-cover" />
                  )}
                  <div className="absolute bottom-0 right-0 bg-[#091428] border border-lol-gold rounded-full p-1.5 z-20">
                    <ChevronDown className="w-4 h-4 text-lol-gold" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                     <h2 className="text-4xl font-display font-black text-white tracking-wide uppercase drop-shadow-md">{currentChampion ? currentChampion.name : 'Select a Champion'}</h2>
                     <button onClick={() => setIsChampSelectOpen(!isChampSelectOpen)} className="text-xs border border-white/10 px-4 py-2 rounded-full hover:border-lol-gold hover:text-lol-gold hover:bg-lol-gold/10 transition uppercase font-bold tracking-wider">{t.change}</button>
                  </div>
                  {currentChampion && (
                    <>
                      <p className="text-lol-gold text-sm italic font-medium mt-1">{currentChampion.title}</p>
                      
                      <div className="mt-5 flex items-center gap-4 bg-[#080808] p-3 rounded-2xl border border-white/5">
                         <span className="text-xs font-bold text-gray-400 uppercase w-16 text-right">{t.level} {championLevel}</span>
                         <input 
                            type="range" 
                            min="1" 
                            max="18" 
                            value={championLevel}
                            onChange={(e) => setChampionLevel(parseInt(e.target.value))}
                            className="flex-grow h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-lol-gold"
                         />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Spells UI */}
              {currentChampion && currentChampion.spells && (
                <div className="mt-8 grid grid-cols-4 gap-4 border-t border-white/5 pt-8 relative z-10">
                   {currentChampion.spells?.map(spell => (
                     <div key={spell.id} className="relative group/spell flex flex-col items-center">
                        <div className="flex flex-col items-center gap-3">
                           <div className="relative w-14 h-14">
                             <img src={spell.imageUrl} className="w-full h-full rounded-2xl border border-gray-600 group-hover/spell:border-lol-gold transition-colors shadow-lg" alt={spell.name} />
                             <div className="absolute -bottom-2 -right-2 bg-[#091428] text-[10px] w-6 h-6 flex items-center justify-center border border-gray-600 rounded-full text-white font-bold">
                               {spell.id}
                             </div>
                           </div>
                           <div className="flex items-center gap-1 mt-1 bg-black/40 rounded-full px-2 py-1 border border-white/5">
                              <button onClick={() => handleSpellLevelChange(spell.id, -1, spell.maxRank)} className="text-gray-500 hover:text-white px-1.5 font-bold text-lg leading-none mb-0.5">-</button>
                              <span className="text-sm text-lol-gold font-bold w-4 text-center">{spellLevels[spell.id] || 0}</span>
                              <button onClick={() => handleSpellLevelChange(spell.id, 1, spell.maxRank)} className="text-gray-500 hover:text-white px-1.5 font-bold text-lg leading-none mb-0.5">+</button>
                           </div>
                        </div>

                        <div className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-64 bg-[#121212] border border-lol-gold/50 p-4 rounded-2xl shadow-2xl z-[100] hidden group-hover/spell:block pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-lol-gold/50">
                           <div className="text-lol-gold font-bold text-sm mb-2 font-display tracking-wide">{spell.name}</div>
                           <div className="text-[10px] text-gray-400 mb-3 leading-relaxed">{spell.description}</div>
                           <div className="text-[10px] text-gray-400 font-mono bg-black/30 p-2 rounded-lg">
                             <div className="flex justify-between mb-1"><span className="text-gray-500">Base:</span> <span>{spell.baseDamage.join('/')}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500">Ratio:</span> <span>{spell.ratios.ap ? `${(spell.ratios.ap * 100)}% AP` : ''} {spell.ratios.ad ? `+ ${(spell.ratios.ad * 100)}% AD` : ''}</span></div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Champion Dropdown */}
            {isChampSelectOpen && (
              <div className="absolute top-full left-0 w-full mt-4 bg-[#121212] border border-lol-gold rounded-[2rem] shadow-2xl z-[60] p-6 animate-fadeIn">
                 <div className="text-xs text-gray-500 uppercase font-bold mb-4 tracking-widest px-2">{t.selectChamp}</div>
                 
                 {/* Search Input for Champions */}
                 <div className="mb-4 px-2 relative">
                    <Search className="absolute left-5 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search champion..." 
                      className="w-full bg-[#080808] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:border-lol-gold outline-none"
                      value={champSearchQuery}
                      onChange={(e) => setChampSearchQuery(e.target.value)}
                      autoFocus
                    />
                 </div>

                 <div className="grid grid-cols-5 gap-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                    {filteredChampions.map(champ => (
                      <div 
                        key={champ.id}
                        onClick={() => { setCurrentChampion(champ); setIsChampSelectOpen(false); setChampSearchQuery(''); }}
                        className={`flex flex-col items-center gap-3 p-4 hover:bg-white/5 cursor-pointer rounded-2xl border transition-all ${currentChampion?.id === champ.id ? 'border-lol-gold bg-lol-gold/10' : 'border-transparent hover:border-lol-gold/30'}`}
                      >
                        <img src={champ.imageUrl} className="w-14 h-14 rounded-full border border-gray-700 shadow-sm" />
                        <span className="text-[10px] text-center text-gray-300 font-bold uppercase truncate w-full">{champ.name}</span>
                      </div>
                    ))}
                    {filteredChampions.length === 0 && (
                       <div className="col-span-5 text-center text-gray-500 text-sm py-4">No champion found.</div>
                    )}
                 </div>
              </div>
            )}
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-3 gap-6 p-8 bg-[#121212] border border-white/5 rounded-[2rem] relative shadow-inner">
          <div className="absolute inset-0 bg-hex-pattern opacity-5 pointer-events-none rounded-[2rem]"></div>
          {selectedItems.map((item, idx) => (
            <div 
              key={idx}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, idx)}
              className={`aspect-square rounded-[1.5rem] border-2 flex items-center justify-center relative group transition-all duration-300 ${
                item 
                  ? 'border-lol-gold bg-[#080808] shadow-glow-gold' 
                  : 'border-white/5 bg-[#080808]/50 border-dashed hover:border-white/20'
              }`}
            >
              {item ? (
                <div 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, 'slot', idx)}
                  className="w-full h-full relative cursor-grab active:cursor-grabbing p-1.5"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center rounded-[1.2rem]">
                     <button 
                        onClick={() => handleRemoveItem(idx)}
                        className="text-white opacity-0 group-hover:opacity-100 hover:text-lol-red transition-all transform scale-0 group-hover:scale-100 bg-black/50 rounded-full p-2"
                      >
                        <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-64 bg-[#121212] border border-lol-gold p-4 rounded-2xl shadow-xl z-[100] hidden group-hover:block animate-fadeIn pointer-events-none">
                     <div className="font-bold text-lol-gold mb-2 font-display text-lg">{item.name}</div>
                     <div className="text-xs text-gray-300 space-y-1">
                       {Object.entries(item.stats || {}).map(([key, val]) => (
                         val ? <div key={key} className="flex justify-between uppercase text-[10px] font-bold"><span>{key}</span> <span className="text-white">+{val}</span></div> : null
                       ))}
                     </div>
                     {item.passive && <div className="text-[10px] text-gray-400 border-t border-gray-800 mt-3 pt-2"><span className="text-lol-gold font-bold">Passif:</span> {item.passive}</div>}
                  </div>
                </div>
              ) : (
                <Plus className="w-8 h-8 text-gray-800 group-hover:text-gray-600 transition-colors" />
              )}
            </div>
          ))}
        </div>

        {/* AI Action Bar & History */}
        <div className="flex gap-4">
           <div className="flex gap-2">
             <button 
                onClick={history.undo} 
                disabled={!history.canUndo}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                title={t.undo}
             >
                <Undo className="w-5 h-5" />
             </button>
             <button 
                onClick={history.redo} 
                disabled={!history.canRedo}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                title={t.redo}
             >
                <Redo className="w-5 h-5" />
             </button>
           </div>

           <button 
             onClick={() => history.reset()}
             className="px-6 py-4 rounded-2xl border border-lol-red/50 text-lol-red hover:bg-lol-red/10 transition uppercase tracking-wider font-bold text-sm flex justify-center items-center gap-2 group flex-1"
           >
             <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" /> {t.reset}
           </button>
           <button 
             onClick={onAnalyze}
             disabled={isAnalyzing}
             className="flex-[2] px-6 py-4 rounded-2xl bg-lol-gold hover:bg-[#D4AF37] text-black font-bold shadow-lg shadow-lol-gold/10 transition uppercase tracking-wider flex justify-center items-center gap-2 disabled:opacity-50 relative overflow-hidden group"
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             <Brain className="w-4 h-4 relative z-10" /> <span className="relative z-10">{isAnalyzing ? t.loading : t.analyzeBuild}</span>
           </button>
        </div>
        
        {/* Thinking State */}
        {isAnalyzing && (
            <div className="bg-[#121212] border border-lol-gold/20 p-6 rounded-[2rem] shadow-xl animate-fadeIn flex items-center gap-5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-lol-gold/5 via-transparent to-lol-gold/5 animate-pulse"></div>
                 <div className="w-12 h-12 rounded-full bg-lol-gold/10 flex items-center justify-center border border-lol-gold/30 relative z-10">
                     <Brain className="w-6 h-6 text-lol-gold animate-pulse" />
                 </div>
                 <div className="relative z-10">
                    <div className="text-lol-gold font-bold text-sm flex items-center gap-2">
                         <Loader2 className="w-3 h-3 animate-spin" />
                         {t.thinking}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{t.analyzingDesc}</span>
                    </div>
                 </div>
            </div>
        )}

        {/* Gemini Result */}
        {aiAnalysis && !isAnalyzing && (
          <div className="bg-[#121212] border border-lol-hextech/30 p-8 rounded-[2rem] shadow-2xl animate-fadeIn relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-lol-hextech/10 rounded-full blur-[100px]"></div>
             <h3 className="text-lol-hextech font-bold mb-4 flex items-center gap-3 font-display text-xl tracking-wide">
               <div className="p-2 bg-lol-hextech/20 rounded-xl"><Brain className="w-6 h-6" /></div> Analyse du Coach
             </h3>
             <div className="prose prose-invert prose-sm text-gray-300 font-light leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
             </div>
          </div>
        )}
    </div>
  );
};
