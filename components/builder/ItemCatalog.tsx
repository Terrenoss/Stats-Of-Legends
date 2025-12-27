import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, Plus, Swords, Wand2, Shield, Zap, Crosshair, Gauge, Hand, AlertCircle } from 'lucide-react';
import { Item, Stats } from '../../types';

interface ItemCatalogProps {
  items: Item[];
  onItemSelect: (item: Item) => void;
  t: Record<string, string>;
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

export const ItemCatalog: React.FC<ItemCatalogProps> = ({ items, onItemSelect, t }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatFilters, setActiveStatFilters] = useState<string[]>([]);

  // Virtualization limited to ~10 items visible via container height
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [listHeight, setListHeight] = useState(0);

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

  const toggleStatFilter = (key: string) => {
    setActiveStatFilters(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

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

  const ITEM_HEIGHT = 84; // one row height
  const totalHeight = filteredItems.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 2);
  const endIndex = Math.min(filteredItems.length, Math.ceil((scrollTop + listHeight) / ITEM_HEIGHT) + 2);
  const visibleItems = filteredItems.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    virtualTop: (startIndex + index) * ITEM_HEIGHT,
  }));

  const noItemsText = t?.noItemsFound ?? 'Aucun objet ne correspond à votre recherche.';

  return (
    <div className="lg:col-span-3 flex flex-col gap-4">
      {/* Search */}
      <div className="bg-[#121212] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-lol-gold" />
          <input
            type="text"
            placeholder={t.searchItem}
            className="w-full bg-[#080808] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-gray-200 focus:border-lol-gold focus:outline-none placeholder-gray-600 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#121212] border border-white/5 p-4 rounded-3xl shadow-xl">
        <div className="flex flex-wrap gap-2">
          {STAT_FILTERS.map(sf => {
            const isActive = activeStatFilters.includes(sf.key);
            const btnClass = isActive
              ? 'bg-lol-red/20 border-lol-red text-lol-red'
              : 'bg-black/30 border-white/5 text-gray-500 hover:border-gray-600';

            return (
              <button
                key={sf.key}
                onClick={() => toggleStatFilter(sf.key)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${btnClass}`}
                title={sf.label}
              >
                {sf.icon}
                <span className="text-[10px] font-bold">{sf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Hint */}
      <div className="md:hidden text-center text-[10px] text-gray-500 flex items-center justify-center gap-1 animate-pulse">
        <Hand className="w-3 h-3" /> Tap item to equip
      </div>

      {/* Item List (Virtualized) */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="bg-[#121212] border border-white/5 rounded-3xl overflow-y-auto p-4 scrollbar-hide shadow-inner relative"
        style={{ maxHeight: ITEM_HEIGHT * 10 }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {visibleItems.map(item => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ITEM_HEIGHT - 12}px`,
                transform: `translateY(${item.virtualTop}px)`,
              }}
              // no drag from catalog, click only
              onClick={() => onItemSelect(item)}
              className="relative bg-[#1a1a1a] hover:bg-[#252525] border border-transparent hover:border-lol-gold/50 p-3 flex items-center gap-4 cursor-pointer transition rounded-2xl group select-none"
            >
              <Image src={item.imageUrl} width={48} height={48} className="w-12 h-12 rounded-xl border border-gray-700 group-hover:border-lol-gold" alt={item.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-200 truncate group-hover:text-lol-gold transition-colors">{item.name}</div>
                <div className="text-xs text-lol-goldDim">{item.price} G</div>
              </div>
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-lol-gold" />

              {/* Hover Tooltip */}
              <div className="absolute left-full top-0 ml-4 w-64 bg-[#121212] border border-lol-gold p-4 rounded-2xl shadow-2xl z-[100] hidden group-hover:block pointer-events-none">
                <div className="font-bold text-lol-gold mb-2 font-display text-lg">{item.name}</div>
                <ItemTags tags={item.tags} />
                <div className="text-xs text-gray-300 space-y-1 mb-3">
                  {Object.entries(item.stats || {}).map(([key, val]) => (
                    val ? <div key={key} className="flex justify-between uppercase text-[10px] tracking-wider font-bold"><span>{key}</span> <span className="text-white">+{val}</span></div> : null
                  ))}
                </div>
                {item.passive && <div className="text-[10px] text-gray-400 border-t border-gray-800 pt-2"><span className="text-lol-gold font-bold">Passif:</span> {item.passive}</div>}
                <div className="text-[10px] text-gray-500 mt-2 italic">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-sm text-gray-500 gap-2">
            <AlertCircle className="w-5 h-5 text-lol-gold" />
            <span>{noItemsText}</span>
          </div>
        )}
      </div>
    </div >
  );
};

const ItemTags = ({ tags }: { tags?: string[] }) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {tags.map(tag => (
        <span key={tag} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-wider">{tag}</span>
      ))}
    </div>
  );
};
