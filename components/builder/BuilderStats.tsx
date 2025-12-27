import React, { useState, useEffect } from 'react';
import { Users, Shield, Swords, Zap, Crosshair } from 'lucide-react';
import { Stats, DummyStats, Champion, Item, SelectedRunes } from '../../types';
import { RuneSelector } from './RuneSelector';
import { StatSection, StatRow, DamageRow, DummyInput } from './BuilderStatsComponents';
import { calculateRuneDamage, calculateAutoDamage } from '../../utils/builderUtils';

interface BuilderStatsProps {
  stats: Stats;
  dummy: DummyStats;
  setDummy: (dummy: DummyStats) => void;
  selectedItems: (Item | null)[];
  currentChampion: Champion;
  spellLevels: { [key: string]: number };
  selectedRunes: SelectedRunes;
  setSelectedRunes: (runes: SelectedRunes) => void;
  championLevel: number;
  t: any;
}

export const BuilderStats: React.FC<BuilderStatsProps> = ({
  stats, dummy, setDummy, selectedItems, currentChampion, spellLevels, selectedRunes, setSelectedRunes, championLevel, t
}) => {
  const [comboToggles, setComboToggles] = useState<{ [key: string]: boolean }>({
    auto: true,
    Q: true,
    W: true,
    E: true,
    R: true
  });

  // Reset toggles when champion changes
  useEffect(() => {
    setComboToggles({ auto: true, Q: true, W: true, E: true, R: true });
  }, [currentChampion.id]);

  const toggleCombo = (key: string) => {
    setComboToggles(prev => ({ ...prev, [key]: !prev[key] }));
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

  const calculateTotalDamage = () => {
    let total = 0;
    if (comboToggles['auto']) {
      total += calculateAutoDamage(stats, dummy) * 3;
    }
    if (currentChampion.spells) {
      currentChampion.spells.forEach(spell => {
        if (comboToggles[spell.id]) {
          total += calculateSpellDamage(spell);
        }
      });
    }
    // Add Rune Damage (Keystone only for now)
    if (selectedRunes.selectedPerkIds[0]) {
      total += calculateRuneDamage(selectedRunes.selectedPerkIds[0], stats, championLevel, dummy, currentChampion);
    }
    return Math.floor(total);
  };

  return (
    <div className="lg:col-span-3 space-y-8">
      {/* Runes Selector */}
      <RuneSelector selectedRunes={selectedRunes} onChange={setSelectedRunes} lang={t === 'FR' ? 'fr_FR' : 'en_US'} />

      {/* Combat Stats */}
      <div className="bg-[#121212] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="bg-[#1a1a1a] p-5 border-b border-white/5 flex items-center justify-between">
          <span className="font-bold text-lol-gold font-display uppercase tracking-wide text-sm">{t.combatStats}</span>
          <Users className="w-5 h-5 text-gray-600" />
        </div>
        <div className="p-6 space-y-6 text-sm bg-[#121212]">
          <StatSection title={t.vitality} icon={<Shield className="w-3 h-3" />}>
            <StatRow label="PV Max" value={Math.round(stats.hp)} color="text-green-400" />
            <StatRow label="Mana" value={Math.round(stats.mp)} color="text-blue-400" />
            <StatRow label="Regen" value={`${stats.mpRegen.toFixed(1)}/s`} />
          </StatSection>
          <div className="h-px bg-white/5"></div>
          <StatSection title={t.offensive} icon={<Swords className="w-3 h-3" />}>
            <StatRow label="Attaque" value={Math.round(stats.ad)} />
            <StatRow label="Puissance" value={Math.round(stats.ap)} color="text-purple-400" />
            <StatRow label="Vit. Atq" value={stats.attackSpeed.toFixed(2)} />
            <StatRow label="Critique" value={stats.crit} suffix="%" color="text-lol-red" />
            <StatRow label="Léthalité" value={stats.lethality || 0} color="text-lol-red" />
            <StatRow label="Péné Mag" value={stats.magicPen || 0} color="text-purple-400" />
          </StatSection>
          <div className="h-px bg-white/5"></div>
          <StatSection title={t.defensive} icon={<Shield className="w-3 h-3" />}>
            <StatRow label="Armure" value={Math.round(stats.armor)} color="text-orange-300" />
            <StatRow label="Résist Mag" value={Math.round(stats.mr)} color="text-blue-300" />
          </StatSection>
          <div className="h-px bg-white/5"></div>
          <StatSection title={t.utility} icon={<Zap className="w-3 h-3" />}>
            <StatRow label="Haste" value={stats.haste} />
            <StatRow label="Vitesse" value={Math.round(stats.moveSpeed)} />
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
            <DummyInput label="PV" value={dummy.hp} onChange={v => setDummy({ ...dummy, hp: v })} />
            <DummyInput label="ARM" value={dummy.armor} onChange={v => setDummy({ ...dummy, armor: v })} />
            <DummyInput label="RM" value={dummy.mr} onChange={v => setDummy({ ...dummy, mr: v })} />
          </div>

          {/* Spell Damage Breakdown */}
          <div className="space-y-3 mt-6">
            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider pb-2 border-b border-white/5">
              <span>Source</span>
              <span>{t.damage}</span>
            </div>

            <DamageRow
              label={t.autoAttack}
              value={Math.floor(calculateAutoDamage(stats, dummy))}
              checked={comboToggles['auto']}
              onToggle={() => toggleCombo('auto')}
              suffix="(x3)"
            />

            {currentChampion.spells?.map(spell => (
              <DamageRow
                key={spell.id}
                label={`${spell.id} - ${spell.name}`}
                value={Math.floor(calculateSpellDamage(spell))}
                checked={comboToggles[spell.id]}
                onToggle={() => toggleCombo(spell.id)}
              />
            ))}

            {/* Rune Damage Row */}
            {selectedRunes.selectedPerkIds[0] && (
              <DamageRow
                label="Keystone Rune"
                value={Math.floor(calculateRuneDamage(selectedRunes.selectedPerkIds[0], stats, championLevel, dummy, currentChampion))}
                checked={true}
                onToggle={() => { }}
                suffix="(Auto)"
              />
            )}
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
  );
};