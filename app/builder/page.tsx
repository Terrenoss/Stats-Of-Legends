"use client";

import React, { useState, useEffect } from 'react';
import { Item, Champion, Stats, DummyStats, Language } from '../../types';
import { DEFAULT_DUMMY, TRANSLATIONS } from '../../constants';
import { analyzeBuild } from '../../services/geminiService';
import { useHistory } from '../../hooks/useHistory';
import { ItemCatalog } from '../../components/builder/ItemCatalog';
import { BuilderGrid } from '../../components/builder/BuilderGrid';
import { BuilderStats } from '../../components/builder/BuilderStats';

export default function BuilderPage() {
  const [currentLang] = useState<Language>('FR');
  const t = TRANSLATIONS[currentLang];

  const { 
    state: selectedItems, 
    set: setSelectedItems, 
    undo, redo, canUndo, canRedo, reset: resetHistory 
  } = useHistory<(Item | null)[]>([null, null, null, null, null, null], 20);

  const [currentChampion, setCurrentChampion] = useState<Champion | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [championLevel, setChampionLevel] = useState<number>(18);
  const [spellLevels, setSpellLevels] = useState<{[key: string]: number}>({ Q: 1, W: 1, E: 1, R: 1 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [dummy, setDummy] = useState<DummyStats>(DEFAULT_DUMMY);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
              t={t}
          />
        )}
    </div>
  );
}