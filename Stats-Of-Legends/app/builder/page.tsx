"use client";

import React, { useState, useEffect } from 'react';
import { Item, Champion, Stats, DummyStats, Language } from '../../types';
import { MOCK_CHAMPIONS, DEFAULT_DUMMY, TRANSLATIONS } from '../../constants';
import { analyzeBuild } from '../../services/geminiService';
import { useHistory } from '../../hooks/useHistory';
import { ItemCatalog } from '../../components/builder/ItemCatalog';
import { BuilderGrid } from '../../components/builder/BuilderGrid';
import { BuilderStats } from '../../components/builder/BuilderStats';

export default function BuilderPage() {
  const [currentLang] = useState<Language>('FR');
  const t = TRANSLATIONS[currentLang];

  // State Hoisting
  const { 
    state: selectedItems, 
    set: setSelectedItems, 
    undo, redo, canUndo, canRedo, reset: resetHistory 
  } = useHistory<(Item | null)[]>([null, null, null, null, null, null], 20);

  const [currentChampion, setCurrentChampion] = useState<Champion>(MOCK_CHAMPIONS[0]);
  const [championLevel, setChampionLevel] = useState<number>(18);
  const [spellLevels, setSpellLevels] = useState<{[key: string]: number}>({ Q: 1, W: 1, E: 1, R: 1 });
  const [stats, setStats] = useState<Stats>(currentChampion.baseStats!);
  const [dummy, setDummy] = useState<DummyStats>(DEFAULT_DUMMY);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Stats Calculation Effect
  useEffect(() => {
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

  // Reset spells when champion changes
  useEffect(() => {
     setSpellLevels({ Q: 1, W: 1, E: 1, R: 1 });
  }, [currentChampion]);

  const handleAnalysis = async () => {
    const activeItems = selectedItems.filter((i): i is Item => i !== null);
    if (activeItems.length === 0) return;
    setIsAnalyzing(true);
    const result = await analyzeBuild(currentChampion, activeItems, stats);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleItemSelect = (item: Item) => {
    const emptyIdx = selectedItems.findIndex(i => i === null);
    if (emptyIdx !== -1) {
        const newI = [...selectedItems]; 
        newI[emptyIdx] = item; 
        setSelectedItems(newI);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[calc(100vh-80px)] animate-fadeIn">
        <ItemCatalog 
            onItemSelect={handleItemSelect}
            t={t}
        />
        
        <BuilderGrid 
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            currentChampion={currentChampion}
            setCurrentChampion={setCurrentChampion}
            championLevel={championLevel}
            setChampionLevel={setChampionLevel}
            spellLevels={spellLevels}
            setSpellLevels={setSpellLevels}
            history={{ undo, redo, canUndo, canRedo, reset: () => resetHistory([null, null, null, null, null, null]) }}
            onAnalyze={handleAnalysis}
            isAnalyzing={isAnalyzing}
            aiAnalysis={aiAnalysis}
            t={t}
        />

        <BuilderStats 
            stats={stats}
            dummy={dummy}
            setDummy={setDummy}
            selectedItems={selectedItems}
            currentChampion={currentChampion}
            spellLevels={spellLevels}
            t={t}
        />
    </div>
  );
}