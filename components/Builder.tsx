import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { RotateCcw, Brain, Undo, Redo } from 'lucide-react';
import { Item, Champion, Stats, DummyStats, Language } from '../types';
import { DEFAULT_DUMMY, TRANSLATIONS } from '../constants';
import { analyzeBuild } from '../services/geminiService';
import { useHistory } from '../hooks/useHistory';
import { ItemCatalog } from './builder/ItemCatalog';
import { RuneSelector } from './builder/RuneSelector';
import { BuilderStats } from './builder/BuilderStats';
import { ChampionSelect } from './builder/ChampionSelect';
import { SelectedRunes } from '../types';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl } from '../utils/ddragon';

interface BuilderProps {
  lang?: Language;
}



import { BuilderItemSlot } from './builder/BuilderItemSlot';

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

  const [stats, setStats] = useState<Stats | null>(null);
  const [dummy, setDummy] = useState<DummyStats>(DEFAULT_DUMMY);
  const [selectedRunes, setSelectedRunes] = useState<SelectedRunes>({
    primaryStyleId: null,
    subStyleId: null,
    selectedPerkIds: [null, null, null, null, null, null, null, null, null]
  });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);






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
              ? getChampionIconUrl(c.imageFull, patch)
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
                ? getSpellIconUrl(s.imageFull, patch)
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
              ? getItemIconUrl(it.imageFull, patch)
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
    if (!currentChampion) return;
    const growth = currentChampion.statsGrowth;
    const base = currentChampion.baseStats!;
    const lvlMod = championLevel - 1;

    let computedStats: Stats = {
      hp: base.hp + (growth?.hp || 0) * lvlMod,
      hpRegen: base.hpRegen + (growth?.hpRegen || 0) * lvlMod,
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
        if (item.stats.hpRegen) computedStats.hpRegen += item.stats.hpRegen;
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
    setSpellLevels({ Q: 1, W: 1, E: 1, R: 1 });
  }, [currentChampion]);


  const handleDragStart = (e: React.DragEvent, source: 'catalog' | 'slot', data: Item | number) => {
    if (source === 'catalog') {
      // drag depuis le catalogue désactivé pour simplifier l'UX
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('sourceType', source);
    e.dataTransfer.setData('slotIndex', (data as number).toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    if (sourceType !== 'slot') return;
    const newItems = [...selectedItems];
    const sourceIndex = parseInt(e.dataTransfer.getData('slotIndex'));
    const temp = newItems[targetIndex];
    newItems[targetIndex] = newItems[sourceIndex];
    newItems[sourceIndex] = temp;
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





  const handleItemClick = (item: Item) => {
    const emptyIdx = selectedItems.findIndex((i) => i === null);
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
          items={items}
          onItemSelect={handleItemClick}
          t={t}
        />
      </div>

      {/* CENTER COLUMN: Builder */}
      <div className="lg:col-span-6 flex flex-col gap-6">

        {/* Champion Selection Header */}
        <ChampionSelect
          currentChampion={currentChampion}
          setCurrentChampion={setCurrentChampion}
          champions={champions}
          championLevel={championLevel}
          setChampionLevel={setChampionLevel}
          spellLevels={spellLevels}
          handleSpellLevelChange={handleSpellLevelChange}
          t={t}
        />

        {/* Slots Grid */}
        <div className="grid grid-cols-3 gap-6 p-8 bg-[#121212] border border-white/5 rounded-[2rem] relative shadow-inner">
          <div className="absolute inset-0 bg-hex-pattern opacity-5 pointer-events-none rounded-[2rem]"></div>
          {selectedItems.map((item, idx) => (
            <BuilderItemSlot
              key={idx}
              item={item}
              index={idx}
              onRemove={handleRemoveItem}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
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
              <div className="flex flex-col gap-2">
                {aiAnalysis.split('\n').map((line, i) => (
                  <p key={i} className="min-h-[1rem]">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Stats & Dummy */}
      {stats && (
        <BuilderStats
          stats={stats}
          dummy={dummy}
          setDummy={setDummy}
          selectedItems={selectedItems}
          currentChampion={currentChampion}
          spellLevels={spellLevels}
          selectedRunes={selectedRunes}
          setSelectedRunes={setSelectedRunes}
          championLevel={championLevel}
          t={t}
        />
      )}
    </div>
  );
};


