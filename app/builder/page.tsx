"use client";

import React, { useState, useEffect } from 'react';
import { useBuilderData } from '@/hooks/useBuilderData';
import { useStatsCalculation } from '@/hooks/useStatsCalculation';
import { useHistory } from '@/hooks/useHistory';
import { useLanguage } from '@/app/LanguageContext';
import { TRANSLATIONS } from '@/constants';
import { Item, Champion, DummyStats, SelectedRunes } from '@/types';
import { ItemCatalog } from '@/components/builder/ItemCatalog';
import { BuilderGrid } from '@/components/builder/BuilderGrid';
import { BuilderStats } from '@/components/builder/BuilderStats';
import { analyzeBuild } from '@/services/AIAnalysisService';

const DEFAULT_DUMMY: DummyStats = {
  hp: 1000,
  armor: 0,
  mr: 0
};

export default function BuilderPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const {
    state: selectedItems,
    set: setSelectedItems,
    undo, redo, canUndo, canRedo, reset: resetHistory
  } = useHistory<(Item | null)[]>([null, null, null, null, null, null], 20);

  const { champions, items } = useBuilderData();

  const [currentChampion, setCurrentChampion] = useState<Champion | null>(null);
  const [championLevel, setChampionLevel] = useState<number>(18);
  const [spellLevels, setSpellLevels] = useState<{ [key: string]: number }>({ Q: 1, W: 1, E: 1, R: 1 });
  const stats = useStatsCalculation(currentChampion, championLevel, selectedItems);
  const [dummy, setDummy] = useState<DummyStats>(DEFAULT_DUMMY);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedRunes, setSelectedRunes] = useState<SelectedRunes>({
    primaryStyleId: null,
    subStyleId: null,
    selectedPerkIds: [null, null, null, null, null, null, null, null, null]
  });

  useEffect(() => {
    if (!currentChampion && champions.length > 0) {
      setCurrentChampion(champions[0]);
    }
  }, [champions, currentChampion]);

  useEffect(() => {
    setSpellLevels({ Q: 1, W: 1, E: 1, R: 1 });
  }, [currentChampion?.id]);

  const handleAnalysis = async () => {
    if (!currentChampion || !stats) return;
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
        items={items}
        onItemSelect={handleItemSelect}
        t={t}
      />

      <BuilderGrid
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        currentChampion={currentChampion}
        setCurrentChampion={setCurrentChampion}
        champions={champions}
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

      {stats && currentChampion && (
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
}