export type Stats = {
  hp: number;
  ad: number;
  ap: number;
  armor: number;
  mr: number;
  as: number; // attack speed (attacks per second)
  crit: number; // crit chance percent
  haste: number; // ability haste
  mp: number; // mana pool
  mp_s: number; // mana regen per second
};

// Simplified base stats for champions: real project should parse champion.json
export function baseChampionStats(championData: any, level: number): Stats {
  const champ = championData || {};
  const baseHp = (champ.hp ?? 500);
  const hpPer = (champ.hpperlevel ?? champ.hpPerLevel ?? 0);
  const baseAd = (champ.attackdamage ?? 60);
  const adPer = (champ.attackdamageperlevel ?? 0);
  const armorBase = (champ.armor ?? 30);
  const armorPer = (champ.armorperlevel ?? 0);
  const mrBase = (champ.spellblock ?? 30);
  const mrPer = (champ.spellblockperlevel ?? 0);
  const asBase = (champ.attackspeed ?? 0.625);
  const asPer = (champ.attackspeedperlevel ?? 0);
  const mpBase = (champ.mp ?? champ.mana ?? 0);
  const mpPer = (champ.mpperlevel ?? champ.manaPerLevel ?? 0);
  const mpRegenBase = (champ.mpregen ?? champ.manaRegen ?? 0);
  const mpRegenPer = (champ.mpregenperlevel ?? 0);

  const hp = baseHp + hpPer * (level - 1);
  const ad = baseAd + adPer * (level - 1);
  const armor = armorBase + armorPer * (level - 1);
  const mr = mrBase + mrPer * (level - 1);
  const as = asBase * (1 + (asPer * (level - 1) / 100));
  const mp = mpBase + mpPer * (level - 1);
  const mp_s = (mpRegenBase / 5) + (mpRegenPer / 5) * (level - 1);

  return { hp: Math.round(hp), ad: Number(ad.toFixed(3)), ap: 0, armor: Number(armor.toFixed(2)), mr: Number(mr.toFixed(2)), as: Number(as.toFixed(3)), crit: 0, haste: 0, mp: Math.round(mp), mp_s: Number(mp_s.toFixed(3)) };
}

// normalize raw item stats from data dragon into keys used here
export function mapItemStats(raw: Record<string, any>) {
  const out: Record<string, number> = {};
  if (!raw) return out;
  // common flat keys
  const mapping: Record<string,string> = {
    FlatHPPoolMod: 'hp',
    FlatPhysicalDamageMod: 'ad',
    FlatAttackDamageMod: 'ad',
    FlatMagicDamageMod: 'ap',
    FlatAbilityPowerMod: 'ap',
    FlatArmorMod: 'armor',
    FlatSpellBlockMod: 'mr',
    FlatAttackSpeedMod: 'as_flat', // additive
    PercentAttackSpeedMod: 'as_percent', // multiplicative (0.25 => +25%)
    FlatCritChanceMod: 'crit',
    FlatMPPoolMod: 'mp',
    FlatMPRegenMod: 'mpregen',
    FlatAbilityHasteMod: 'haste'
  };

  for (const k of Object.keys(raw)) {
    if (mapping[k]) {
      out[mapping[k]] = Number(raw[k]);
    } else {
      out[k] = Number(raw[k]);
    }
  }

  // normalize some common conventions
  if (out['crit'] !== undefined) {
    // if crit is given as fraction (0.2) => convert to percent
    if (out['crit'] > 0 && out['crit'] <= 1) out['crit'] = out['crit'] * 100;
  }

  // some feeds use PercentAttackSpeedMod in percent form like 25 (meaning 25%)
  if (out['as_percent'] !== undefined) {
    const v = out['as_percent'];
    if (v > 1 && v <= 100) out['as_percent'] = v / 100; // convert 25 -> 0.25
  }

  return out;
}

export function applyItems(base: Stats, items: Array<any>) {
  const s = { ...base } as any;
  const asMultipliers: number[] = [];
  let asFlatAdd = 0;
  for (const it of items) {
    if (!it || !it.stats) continue;
    const mapped = mapItemStats(it.stats);
    if (mapped.hp) s.hp += mapped.hp;
    if (mapped.armor) s.armor += mapped.armor;
    if (mapped.mr) s.mr += mapped.mr;
    if (mapped.ad) s.ad += mapped.ad;
    if (mapped.ap) s.ap += mapped.ap;
    if (mapped.crit) s.crit += mapped.crit; // already in percent
    if (mapped.haste) s.haste += mapped.haste;
    if (mapped.mp) s.mp += mapped.mp;
    if (mapped.mpregen) s.mp_s += (mapped.mpregen / 5);

    // attack speed handling
    if (mapped.as_flat) {
      // FlatAttackSpeedMod is usually a fraction (e.g. 0.1) representing +10% add
      // treat flat as additive to attacks-per-second baseline (rare)
      asFlatAdd += mapped.as_flat;
    }
    if (mapped.as_percent) {
      asMultipliers.push(1 + mapped.as_percent);
    }
  }

  // apply AS multipliers together
  if (asMultipliers.length > 0) {
    const prod = asMultipliers.reduce((a,b)=>a*b, 1);
    s.as = s.as * prod;
  }
  // then add any flat add
  if (asFlatAdd) s.as = s.as + asFlatAdd;

  return s as Stats;
}

export function applyShards(stats: Stats, shards: { offense?: string; flex?: string; defense?: string }) {
  const s = { ...stats } as any;
  // Offense
  if (shards.offense) {
    if (shards.offense === 'adaptive_force') {
      if (s.ap > s.ad) s.ap += 15; else s.ad += 9;
    } else if (shards.offense === 'attack_speed') {
      s.as *= 1.10; // +10%
    } else if (shards.offense === 'ability_haste') {
      s.haste += 8;
    }
  }

  // Flex
  if (shards.flex) {
    if (shards.flex === 'adaptive_force') { if (s.ap > s.ad) s.ap += 15; else s.ad += 9; }
    else if (shards.flex === 'armor') { s.armor += 6; }
    else if (shards.flex === 'magic_resist') { s.mr += 8; }
  }

  // Defense
  if (shards.defense) {
    if (shards.defense === 'hp') s.hp += 65;
    else if (shards.defense === 'armor') s.armor += 15;
    else if (shards.defense === 'magic_resist') s.mr += 15;
  }

  return s as Stats;
}

export function aggregateStats(championData: any, level: number, items: Array<any>, shards: { offense?: string; flex?: string; defense?: string }) {
  const base = baseChampionStats(championData, level);
  const afterItems = applyItems(base, items);
  const afterShards = applyShards(afterItems, shards);
  return afterShards as Stats;
}

export default {
  baseChampionStats,
  mapItemStats,
  applyItems,
  applyShards,
  aggregateStats
};
