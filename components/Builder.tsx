import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Zap, Shield, Swords, Brain, RotateCcw, Crosshair, Users, ChevronDown, Wand2, Droplets, Gauge, CheckSquare, Square, Undo, Redo, Filter } from 'lucide-react';
import { Item, Champion, Stats, DummyStats, Language } from '../types';
import { DEFAULT_DUMMY, TRANSLATIONS } from '../constants';
import { analyzeBuild } from '../services/geminiService';
import { useHistory } from '../hooks/useHistory';
import { ItemCatalog } from './builder/ItemCatalog';

interface BuilderProps {
  lang?: Language;
}

const STAT_FILTERS: { key: keyof Stats; label: string; icon: React.ReactNode }[] = [
  { key: 'ad', label: 'AD', icon: <Swords className="w-3 h-3" /> },
  { key: 'ap', label: 'AP', icon: <Wand2 className="w-3 h-3" /> },
  { key: 'armor', label: 'Armor', icon: <Shield className="w-3 h-3" /> },
  { key: 'mr', label: 'MR', icon: <Shield className="w-3 h-3" /> },
  { key: 'hp', label: 'HP', icon: <Plus className="w-3 h-3" /> },
  { key: 'haste', label: 'Haste', icon: <Zap className="w-3 h-3" /> },
  { key: 'attackSpeed', label: 'AS', icon: <Swords className="w-3 h-3" /> },
  { key: 'crit', label: 'Crit', icon: <Crosshair className="w-3 h-3" /> },
  { key: 'moveSpeed', label: 'Speed', icon: <Gauge className="w-3 h-3" /> },
];

export const Builder: React.FC<BuilderProps> = ({ lang = 'FR' }) => {
  const {
    state: selectedItems,
    set: setSelectedItems,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<(Item | null)[]>([null, null, null, null, null, null], 20);

  const [currentChampion, setCurrentChampion] = useState<Champion | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [championLevel, setChampionLevel] = useState<number>(18);
  const [spellLevels, setSpellLevels] = useState<{ [key: string]: number }>({ Q: 1, W: 1, E: 1, R: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [champSearchQuery, setChampSearchQuery] = useState('');
  const [activeStatFilters, setActiveStatFilters] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dummy, setDummy] = useState<DummyStats>(DEFAULT_DUMMY);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChampSelectOpen, setIsChampSelectOpen] = useState(false);

  const [comboToggles, setComboToggles] = useState<{ [key: string]: boolean }>({
    auto: true,
    Q: true,
    W: true,
    E: true,
    R: true,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [listHeight, setListHeight] = useState(500);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    async function loadData() {
      try {
        const [champRes, itemRes] = await Promise.all([
          fetch('/api/dd/champions?patch=latest&locale=fr_FR'),
          fetch('/api/dd/items?patch=latest&locale=fr_FR'),
        ]);
        if (champRes.ok) {
          const champJson = await champRes.json();
          const patch = champJson.patch || 'latest';
          const champs: Champion[] = (champJson.data || []).map((c: any) => ({
            id: Number(c.key || c.id),
            name: c.name,
            title: c.title,
            imageUrl: c.imageFull
              ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${c.imageFull}`
              : '',
            baseStats: {
              hp: c.stats?.hp ?? 0,
              mp: c.stats?.mp ?? 0,
              mpRegen: c.stats?.mpregen ?? 0,
              ad: c.stats?.attackdamage ?? 0,
              ap: 0,
              armor: c.stats?.armor ?? 0,
              mr: c.stats?.spellblock ?? 0,
              attackSpeed: c.stats?.attackspeed ?? 0,
              haste: 0,
              crit: c.stats?.crit ?? 0,
              moveSpeed: c.stats?.movespeed ?? 0,
            },
            statsGrowth: {
              hp: c.stats?.hpperlevel ?? 0,
              mp: c.stats?.mpperlevel ?? 0,
              mpRegen: c.stats?.mpregenperlevel ?? 0,
              ad: c.stats?.attackdamageperlevel ?? 0,
              armor: c.stats?.armorperlevel ?? 0,
              mr: c.stats?.spellblockperlevel ?? 0,
              attackSpeed: c.stats?.attackspeedperlevel ?? 0,
            },
            spells: (c.spells || []).map((s: any, idx: number) => ({
              id: ['Q', 'W', 'E', 'R'][idx] || String(idx),
              name: s.name,
              imageUrl: s.imageFull
                ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${s.imageFull}`
                : '',
              description: s.description || s.tooltip || '',
              maxRank: s.maxRank || 5,
              cooldown: s.cooldown || [],
              cost: s.cost || [],
              baseDamage: s.baseDamage || [],
              ratios: s.ratios || {},
              damageType: s.damageType || 'magic',
            })),
          }));
          setChampions(champs);
          if (!currentChampion && champs.length > 0) {
            setCurrentChampion(champs[0]);
          }
        }
        if (itemRes.ok) {
          const itemJson = await itemRes.json();
          const patch = itemJson.patch || 'latest';
          const its: Item[] = (itemJson.data || []).map((it: any) => ({
            id: Number(it.id),
            name: it.name,
            imageUrl: it.imageFull
              ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${it.imageFull}`
              : '',
            price: it.gold?.total,
            stats: {
              hp: it.stats?.FlatHPPoolMod ?? 0,
              mp: it.stats?.FlatMPPoolMod ?? 0,
              ad: it.stats?.FlatPhysicalDamageMod ?? 0,
              ap: it.stats?.FlatMagicDamageMod ?? 0,
              armor: it.stats?.FlatArmorMod ?? 0,
              mr: it.stats?.FlatSpellBlockMod ?? 0,
              moveSpeed: it.stats?.FlatMovementSpeedMod ?? 0,
              attackSpeed: it.stats?.PercentAttackSpeedMod ? it.stats.PercentAttackSpeedMod * 100 : 0,
              crit: it.stats?.FlatCritChanceMod ? it.stats.FlatCritChanceMod * 100 : 0,
              haste: it.stats?.AbilityHaste ?? 0,
            },
          }));
          setItems(its);
        }
      } catch (err) {
        console.error('Failed to load DD data for builder', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
           if (canRedo) redo();
        } else {
           if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
         if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            setListHeight(entry.contentRect.height);
        }
    });
    if (scrollRef.current) {
        observer.observe(scrollRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!currentChampion) return;
    const growth = currentChampion.statsGrowth;
    const base = currentChampion.baseStats!;
    const lvlMod = championLevel - 1;

    let computedStats: Stats = {
       hp: base.hp + (growth?.hp || 0) * lvlMod,
       mp: base.mp + (growth?.mp || 0) * lvlMod,
       mpRegen: base.mpRegen + (growth?.mpRegen || 0) * lvlMod,
       ad: base.ad + (growth?.ad || 0) * lvlMod,
       ap: base.ap, 
       armor: base.armor + (growth?.armor || 0) * lvlMod,
       mr: base.mr + (growth?.mr || 0) * lvlMod,
       attackSpeed: base.attackSpeed, 
       haste: base.haste,
       crit: base.crit,
       moveSpeed: base.moveSpeed,
       lethality: 0,
       magicPen: 0,
       percentPen: 0
    };

    const bonusAsFromLevel = (growth?.attackSpeed || 0) * lvlMod;
    
    let itemBonusAs = 0;
    selectedItems.forEach(item => {
      if (item && item.stats) {
        if (item.stats.ad) computedStats.ad += item.stats.ad;
        if (item.stats.ap) computedStats.ap += item.stats.ap;
        if (item.stats.hp) computedStats.hp += item.stats.hp;
        if (item.stats.mp) computedStats.mp += item.stats.mp;
        if (item.stats.mpRegen) computedStats.mpRegen += item.stats.mpRegen;
        if (item.stats.armor) computedStats.armor += item.stats.armor;
        if (item.stats.mr) computedStats.mr += item.stats.mr;
        if (item.stats.haste) computedStats.haste += item.stats.haste;
        if (item.stats.crit) computedStats.crit += item.stats.crit;
        if (item.stats.moveSpeed) computedStats.moveSpeed += item.stats.moveSpeed;
        if (item.stats.attackSpeed) itemBonusAs += item.stats.attackSpeed;
        if (item.stats.magicPen) computedStats.magicPen = (computedStats.magicPen || 0) + item.stats.magicPen;
        if (item.stats.lethality) computedStats.lethality = (computedStats.lethality || 0) + item.stats.lethality;
      }
    });

    const totalBonusAs = bonusAsFromLevel + itemBonusAs;
    computedStats.attackSpeed = computedStats.attackSpeed * (1 + (totalBonusAs / 100));

    setStats(computedStats);
  }, [selectedItems, currentChampion, championLevel]);

  useEffect(() => {
     setSpellLevels({ Q: 1, W: 1, E: 1, R: 1 });
     setComboToggles({ auto: true, Q: true, W: true, E: true, R: true });
  }, [currentChampion]);


  const handleDragStart = (e: React.DragEvent, source: 'catalog' | 'slot', data: Item | number) => {
    e.dataTransfer.setData('sourceType', source);
    if (source === 'catalog') {
      e.dataTransfer.setData('itemId', (data as Item).id.toString());
    } else {
      e.dataTransfer.setData('slotIndex', (data as number).toString());
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const newItems = [...selectedItems];

    if (sourceType === 'catalog') {
      const itemId = parseInt(e.dataTransfer.getData('itemId'));
      const item = items.find(i => i.id === itemId);
      if (item) {
        newItems[targetIndex] = item;
      }
    } else if (sourceType === 'slot') {
      const sourceIndex = parseInt(e.dataTransfer.getData('slotIndex'));
      const temp = newItems[targetIndex];
      newItems[targetIndex] = newItems[sourceIndex];
      newItems[sourceIndex] = temp;
    }
    setSelectedItems(newItems);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems[index] = null;
    setSelectedItems(newItems);
  };

  const handleReset = () => {
      resetHistory([null, null, null, null, null, null]);
  };

  const handleAnalysis = async () => {
    const activeItems = selectedItems.filter((i): i is Item => i !== null);
    if (activeItems.length === 0) return;
    setIsAnalyzing(true);
    const result = await analyzeBuild(currentChampion, activeItems, stats);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSpellLevelChange = (spellKey: string, delta: number, max: number) => {
    setSpellLevels(prev => {
      const current = prev[spellKey] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [spellKey]: next };
    });
  };

  const toggleCombo = (key: string) => {
    setComboToggles(prev => ({...prev, [key]: !prev[key]}));
  };

  const calculateSpellDamage = (spell: any) => {
     const lvl = spellLevels[spell.id] || 0;
     if (lvl === 0) return 0;
     
     const base = spell.baseDamage[lvl - 1] || 0;
     const scaling = (spell.ratios.ap ? stats.ap * spell.ratios.ap : 0) + 
                     (spell.ratios.ad ? stats.ad * spell.ratios.ad : 0);
     
     const rawDamage = base + scaling;

     const effectiveArmor = Math.max(0, dummy.armor - (stats.lethality || 0)); 
     const effectiveMr = dummy.mr * (1 - ((stats.percentPen || 0) / 100)) - (stats.magicPen || 0);
     
     const physReduction = 100 / (100 + effectiveArmor);
     const magicReduction = 100 / (100 + Math.max(0, effectiveMr));

     if (spell.damageType === 'magic') return rawDamage * magicReduction;
     if (spell.damageType === 'physical') return rawDamage * physReduction;
     return rawDamage;
  };

  const calculateAutoDamage = () => {
    const effectiveArmor = Math.max(0, dummy.armor - (stats.lethality || 0));
    const physReduction = 100 / (100 + effectiveArmor);
    return stats.ad * physReduction;
  };

  const calculateTotalDamage = () => {
    let total = 0;
    if (comboToggles['auto']) {
        total += calculateAutoDamage() * 3;
    }
    if (currentChampion.spells) {
       currentChampion.spells.forEach(spell => {
          if (comboToggles[spell.id]) {
            total += calculateSpellDamage(spell);
          }
       });
    }
    return Math.floor(total);
  };

  const toggleStatFilter = (key: string) => {
      setActiveStatFilters(prev => 
        prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
      );
  };

  // Handle scroll for virtualization
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStats = true;
    if (activeStatFilters.length > 0) {
        if (!item.stats) matchesStats = false;
        else {
            matchesStats = activeStatFilters.some(statKey => (item.stats as any)[statKey] > 0);
        }
    }
    return matchesSearch && matchesStats;
  });

  const filteredChampions = champions.filter(champ =>
    champ.name.toLowerCase().includes(champSearchQuery.toLowerCase())
  );

  // Virtualization constants
  const ITEM_HEIGHT = 84; // 72px item + 12px gap
  const totalHeight = filteredItems.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(filteredItems.length, Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + 2);
  
  const visibleItems = filteredItems.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualTop: (startIndex + index) * ITEM_HEIGHT
  }));

  const handleItemClick = (item: Item) => {
    const emptyIdx = selectedItems.findIndex(i => i === null);
    const targetIdx = emptyIdx === -1 ? selectedItems.length - 1 : emptyIdx;
    const newItems = [...selectedItems];
    newItems[targetIdx] = item;
    setSelectedItems(newItems);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[calc(100vh-80px)]">
      
      {/* LEFT COLUMN: Item Catalog */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <ItemCatalog
          items={filteredItems}
          onItemSelect={handleItemClick}
          t={t}
        />
      </div>

      {/* CENTER COLUMN: Builder */}
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
                  <img src={currentChampion?.imageUrl} alt={currentChampion?.name} className="relative w-28 h-28 rounded-full border-4 border-[#121212] ring-2 ring-lol-gold shadow-2xl transition-transform group-hover:scale-105 object-cover" />
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
              onDragOver={handleDragOver}
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
           {/* History Controls */}
           <div className="flex gap-2">
             <button 
                onClick={undo} 
                disabled={!canUndo}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                title={t.undo}
             >
                <Undo className="w-5 h-5" />
             </button>
             <button 
                onClick={redo} 
                disabled={!canRedo}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition bg-[#121212]"
                title={t.redo}
             >
                <Redo className="w-5 h-5" />
             </button>
           </div>

           <button 
             onClick={handleReset}
             className="px-6 py-4 rounded-2xl border border-lol-red/50 text-lol-red hover:bg-lol-red/10 transition uppercase tracking-wider font-bold text-sm flex justify-center items-center gap-2 group flex-1"
           >
             <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" /> {t.reset}
           </button>
           <button 
             onClick={handleAnalysis}
             disabled={isAnalyzing}
             className="flex-[2] px-6 py-4 rounded-2xl bg-lol-gold hover:bg-[#D4AF37] text-black font-bold shadow-lg shadow-lol-gold/10 transition uppercase tracking-wider flex justify-center items-center gap-2 disabled:opacity-50 relative overflow-hidden group"
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             <Brain className="w-4 h-4 relative z-10" /> <span className="relative z-10">{isAnalyzing ? t.loading : t.analyzeBuild}</span>
           </button>
        </div>
        
        {/* Gemini Result */}
        {aiAnalysis && (
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

      {/* RIGHT COLUMN: Stats & Dummy */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* Combat Stats */}
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="bg-[#1a1a1a] p-5 border-b border-white/5 flex items-center justify-between">
            <span className="font-bold text-lol-gold font-display uppercase tracking-wide text-sm">{t.combatStats}</span>
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div className="p-6 space-y-6 text-sm bg-[#121212]">
             <StatSection title={t.vitality} icon={<Shield className="w-3 h-3"/>}>
                <StatRow label="PV Max" value={Math.round(stats?.hp || 0)} color="text-green-400" />
                <StatRow label="Mana" value={Math.round(stats?.mp || 0)} color="text-blue-400" />
                <StatRow label="Regen" value={`${(stats?.mpRegen || 0).toFixed(1)}/s`} />
             </StatSection>
             <div className="h-px bg-white/5"></div>
             <StatSection title={t.offensive} icon={<Swords className="w-3 h-3"/>}>
                <StatRow label="Attaque" value={Math.round(stats?.ad || 0)} />
                <StatRow label="Puissance" value={Math.round(stats?.ap || 0)} color="text-purple-400" />
                <StatRow label="Vit. Atq" value={stats?.attackSpeed.toFixed(2) || 0} />
                <StatRow label="Critique" value={stats?.crit || 0} suffix="%" color="text-lol-red" />
                <StatRow label="Léthalité" value={stats?.lethality || 0} color="text-lol-red" />
                <StatRow label="Péné Mag" value={stats?.magicPen || 0} color="text-purple-400" />
             </StatSection>
             <div className="h-px bg-white/5"></div>
             <StatSection title={t.defensive} icon={<Shield className="w-3 h-3"/>}>
                <StatRow label="Armure" value={Math.round(stats?.armor || 0)} color="text-orange-300" />
                <StatRow label="Résist Mag" value={Math.round(stats?.mr || 0)} color="text-blue-300" />
             </StatSection>
             <div className="h-px bg-white/5"></div>
             <StatSection title={t.utility} icon={<Zap className="w-3 h-3"/>}>
                <StatRow label="Haste" value={stats?.haste || 0} />
                <StatRow label="Vitesse" value={Math.round(stats?.moveSpeed || 0)} />
             </StatSection>
          </div>
          <div className="p-4 bg-black/30 border-t border-white/5 text-center">
             <span className="text-gray-500 text-xs uppercase mr-2 font-bold">{t.totalCost}</span>
             <span className="text-lol-gold font-bold font-mono text-lg">
               {selectedItems.reduce((acc, item) => acc + (item?.price || 0), 0)} <span className="text-xs align-top">G</span>
             </span>
          </div>
        </div>

        {/* Target Dummy */}
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="bg-[#1a1a1a] p-5 border-b border-white/5 flex items-center justify-between">
            <span className="font-bold text-gray-200 font-display uppercase tracking-wide text-sm">{t.targetDummy}</span>
            <Crosshair className="w-5 h-5 text-lol-red animate-pulse" />
          </div>
          
          <div className="p-6 space-y-5 bg-[#121212]">
             <div className="grid grid-cols-3 gap-3">
               <DummyInput label="PV" value={dummy.hp} onChange={v => setDummy({...dummy, hp: v})} />
               <DummyInput label="ARM" value={dummy.armor} onChange={v => setDummy({...dummy, armor: v})} />
               <DummyInput label="RM" value={dummy.mr} onChange={v => setDummy({...dummy, mr: v})} />
             </div>

             {/* Spell Damage Breakdown */}
             <div className="space-y-3 mt-6">
                <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider pb-2 border-b border-white/5">
                   <span>Source</span>
                   <span>{t.damage}</span>
                </div>
                
                <DamageRow 
                  label={t.autoAttack} 
                  value={Math.floor(calculateAutoDamage())} 
                  checked={comboToggles['auto']} 
                  onToggle={() => toggleCombo('auto')}
                  suffix="(x3)"
                />
                
                {currentChampion?.spells?.map(spell => (
                  <DamageRow 
                    key={spell.id}
                    label={`${spell.id} - ${spell.name}`} 
                    value={Math.floor(calculateSpellDamage(spell))}
                    checked={comboToggles[spell.id]}
                    onToggle={() => toggleCombo(spell.id)}
                  />
                ))}
             </div>

             <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center border border-lol-red/20 mt-6 relative overflow-hidden group shadow-lg">
               <div className="absolute inset-0 bg-lol-red/5 group-hover:bg-lol-red/10 transition-colors duration-500"></div>
               <div className="relative z-10">
                  <div className="text-[10px] text-gray-500 uppercase mb-2 font-bold tracking-widest">{t.comboTotal}</div>
                  <div className="text-4xl font-black text-lol-red font-mono drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                    {calculateTotalDamage()}
                  </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div>
    <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-3 flex items-center gap-2 tracking-wider">
      {icon} {title}
    </h4>
    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
      {children}
    </div>
  </div>
);

const StatRow = ({ label, value, suffix = '', color = 'text-gray-300' }: any) => (
  <div className="flex justify-between items-baseline group">
    <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors truncate mr-2">{label}</span>
    <span className={`font-mono text-xs font-bold ${color} whitespace-nowrap`}>{value}{suffix}</span>
  </div>
);

const DamageRow = ({ label, value, checked, onToggle, suffix }: any) => (
  <div 
    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${checked ? 'bg-white/5 border border-white/5' : 'opacity-40 hover:opacity-70 border border-transparent'}`}
    onClick={onToggle}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      {checked ? <CheckSquare className="w-4 h-4 text-lol-gold" /> : <Square className="w-4 h-4 text-gray-600" />}
      <span className="text-xs text-gray-300 truncate font-medium">{label} {suffix && <span className="text-[10px] text-gray-500 ml-1">{suffix}</span>}</span>
    </div>
    <span className="font-mono text-sm font-bold text-white whitespace-nowrap">{value}</span>
  </div>
);

const DummyInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] text-gray-500 text-center font-bold tracking-wider">{label}</label>
    <input 
      type="number" 
      className="bg-[#080808] border border-white/10 text-white text-center text-sm py-2 rounded-xl focus:border-lol-gold outline-none transition-colors font-mono"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);
