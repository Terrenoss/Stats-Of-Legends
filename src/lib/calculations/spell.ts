import { Stats } from './stats';

export type SpellDef = {
  id: string;
  name: string;
  description?: string;
  maxRank?: number;
  baseByRank?: number[]; // base damage per rank
  scalingAD?: number; // multiplier per AD
  scalingAP?: number; // multiplier per AP
  type?: 'physical'|'magical';
};

export function spellDamageComponents(stats: any, spell: SpellDef, rank = 1) {
  const r = Math.max(1, Math.min(spell.maxRank || 1, rank));
  const base = (spell.baseByRank && spell.baseByRank[r-1]) || spell.baseByRank?.[0] || (spell as any).base || 0;
  const ad = stats.ad || 0;
  const ap = stats.ap || 0;
  const adContrib = (spell.scalingAD || 0) * ad;
  const apContrib = (spell.scalingAP || 0) * ap;
  const raw = base + adContrib + apContrib;
  return { base, adContrib, apContrib, raw };
}

export function calcSpellDamageFromSpell(stats: any, spell: SpellDef, rank = 1) {
  return spellDamageComponents(stats, spell, rank).raw;
}

export function damageAfterArmor(raw: number, armor: number) {
  return raw * (100 / (100 + armor));
}

export function damageAfterMR(raw: number, mr: number) {
  return raw * (100 / (100 + mr));
}

// backward-compatible helper: if passed number, keep old behavior
export function calcSpellDamage(baseStats: Stats, scalingADPercent = 1) {
  const raw = 100 + baseStats.ad * scalingADPercent;
  return raw;
}

export default { calcSpellDamageFromSpell, calcSpellDamage };
