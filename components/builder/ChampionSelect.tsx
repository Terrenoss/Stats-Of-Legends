import React, { useState } from 'react';
import Image from 'next/image';
import { Search, ChevronDown } from 'lucide-react';
import { Champion } from '../../types';

interface ChampionSelectProps {
    currentChampion: Champion | null;
    setCurrentChampion: (c: Champion) => void;
    champions: Champion[];
    championLevel: number;
    setChampionLevel: (l: number) => void;
    spellLevels: { [key: string]: number };
    handleSpellLevelChange: (spellKey: string, delta: number, max: number) => void;
    t: Record<string, string>;
}

export const ChampionSelect: React.FC<ChampionSelectProps> = ({
    currentChampion,
    setCurrentChampion,
    champions,
    championLevel,
    setChampionLevel,
    spellLevels,
    handleSpellLevelChange,
    t
}) => {
    const [isChampSelectOpen, setIsChampSelectOpen] = useState(false);
    const [champSearchQuery, setChampSearchQuery] = useState('');

    const filteredChampions = champions.filter(champ =>
        champ.name.toLowerCase().includes(champSearchQuery.toLowerCase())
    );

    return (
        <div className="relative z-20">
            <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-8 relative shadow-2xl">
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-lol-gold/5 to-transparent"></div>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                    <div className="relative cursor-pointer group" onClick={() => setIsChampSelectOpen(!isChampSelectOpen)}>
                        <div className="absolute -inset-2 bg-lol-gold rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                        {currentChampion?.imageUrl && (
                            <Image src={currentChampion.imageUrl} width={112} height={112} alt={currentChampion.name} className="relative w-28 h-28 rounded-full border-4 border-[#121212] ring-2 ring-lol-gold shadow-2xl transition-transform group-hover:scale-105 object-cover" />
                        )}
                        <div className="absolute bottom-0 right-0 bg-[#091428] border border-lol-gold rounded-full p-1.5 z-20">
                            <ChevronDown className="w-4 h-4 text-lol-gold" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-4xl font-display font-black text-white tracking-wide uppercase drop-shadow-md">{currentChampion?.name}</h2>
                            <button onClick={() => setIsChampSelectOpen(!isChampSelectOpen)} className="text-xs border border-white/10 px-4 py-2 rounded-full hover:border-lol-gold hover:text-lol-gold hover:bg-lol-gold/10 transition uppercase font-bold tracking-wider">{t.change}</button>
                        </div>
                        <p className="text-lol-gold text-sm italic font-medium mt-1">{currentChampion?.title}</p>

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
                    </div>
                </div>

                {/* Spells UI */}
                <div className="mt-8 grid grid-cols-4 gap-4 border-t border-white/5 pt-8 relative z-10">
                    {currentChampion?.spells?.map(spell => (
                        <div key={spell.id} className="relative group/spell flex flex-col items-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-14 h-14">
                                    <Image src={spell.imageUrl} width={56} height={56} className="w-full h-full rounded-2xl border border-gray-600 group-hover/spell:border-lol-gold transition-colors shadow-lg" alt={spell.name} />
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
                            <ChampionCard
                                key={champ.id}
                                champ={champ}
                                isSelected={currentChampion?.id === champ.id}
                                onClick={() => { setCurrentChampion(champ); setIsChampSelectOpen(false); setChampSearchQuery(''); }}
                            />
                        ))}
                        {filteredChampions.length === 0 && (
                            <div className="col-span-5 text-center text-gray-500 text-sm py-4">No champion found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ChampionCard = ({ champ, isSelected, onClick }: { champ: Champion, isSelected: boolean, onClick: () => void }) => {
    const cardClass = isSelected
        ? 'border-lol-gold bg-lol-gold/10'
        : 'border-transparent hover:border-lol-gold/30';

    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center gap-3 p-4 hover:bg-white/5 cursor-pointer rounded-2xl border transition-all ${cardClass}`}
        >
            <Image src={champ.imageUrl} width={56} height={56} className="w-14 h-14 rounded-full border border-gray-700 shadow-sm" alt={champ.name} />
            <span className="text-[10px] text-center text-gray-300 font-bold uppercase truncate w-full">{champ.name}</span>
        </div>
    );
};
