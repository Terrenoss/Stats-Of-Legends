import React from 'react';
import { Champion, Item } from '../../types';
import { ChampionSelect } from './ChampionSelect';
import { BuilderItemSlot } from './BuilderItemSlot';
import { BuilderActions } from './BuilderActions';

interface BuilderGridProps {
  selectedItems: (Item | null)[];
  setSelectedItems: (items: (Item | null)[]) => void;
  currentChampion: Champion | null;
  setCurrentChampion: (champ: Champion) => void;
  champions: Champion[];
  championLevel: number;
  setChampionLevel: (lvl: number) => void;
  spellLevels: { [key: string]: number };
  setSpellLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; reset: () => void };
  onAnalyze: () => void;
  isAnalyzing: boolean;
  aiAnalysis: string | null;
  t: Record<string, string>;
}

export const BuilderGrid: React.FC<BuilderGridProps> = ({
  selectedItems, setSelectedItems, currentChampion, setCurrentChampion, champions,
  championLevel, setChampionLevel, spellLevels, setSpellLevels,
  history, onAnalyze, isAnalyzing, aiAnalysis, t
}) => {

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
            onDragStart={(e, source, data) => handleDragStart(e, 'slot', idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* AI Action Bar & History */}
      <BuilderActions
        history={history}
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
        aiAnalysis={aiAnalysis}
        t={t}
      />
    </div>
  );
};
