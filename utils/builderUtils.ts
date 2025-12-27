import { Champion, Item, Stats } from '../types';
import { getChampionIconUrl, getSpellIconUrl, getItemIconUrl } from './ddragon';

export const transformChampionData = (champJson: any): Champion[] => {
    const patch = champJson.patch || 'latest';
    return (champJson.data || []).map((c: any) => ({
        id: Number(c.key || c.id),
        name: c.name,
        title: c.title,
        imageUrl: c.imageFull ? getChampionIconUrl(c.imageFull, patch) : '',
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
            imageUrl: s.imageFull ? getSpellIconUrl(s.imageFull, patch) : '',
            description: s.description || s.tooltip || '',
            maxRank: s.maxRank || 5,
            cooldown: s.cooldown || [],
            cost: s.cost || [],
            baseDamage: s.baseDamage || [],
            ratios: s.ratios || {},
            damageType: s.damageType || 'magic',
        })),
    }));
};

export const transformItemData = (itemJson: any): Item[] => {
    const patch = itemJson.patch || 'latest';
    return (itemJson.data || []).map((it: any) => ({
        id: Number(it.id),
        name: it.name,
        imageUrl: it.imageFull ? getItemIconUrl(it.imageFull, patch) : '',
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
};

export const calculateStats = (currentChampion: Champion | null, championLevel: number, selectedItems: (Item | null)[]): Stats | null => {
    if (!currentChampion) return null;
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

    return computedStats;
};


export const getEffectiveResist = (dummy: { armor: number, mr: number }, stats: Stats, isAd: boolean) => {
    if (isAd) {
        return Math.max(0, dummy.armor - (stats.lethality || 0));
    }
    return dummy.mr * (1 - ((stats.percentPen || 0) / 100)) - (stats.magicPen || 0);
};

export const getReduction = (effectiveResist: number) => {
    return 100 / (100 + Math.max(0, effectiveResist));
};

export const calculateRuneDamage = (runeId: number | null, stats: Stats, championLevel: number, dummy: { armor: number, mr: number }, currentChampion: Champion | null) => {
    if (!runeId || !stats) return 0;

    const baseAd = currentChampion?.baseStats?.ad || 0;
    const bonusAd = stats.ad - baseAd;

    // Manual implementation of popular keystones
    // Electrocute (ID: 8112): 30-180 (+0.4 bonus AD, +0.25 AP)
    if (runeId === 8112) {
        const base = 30 + (150 * (championLevel - 1) / 17);
        const scaling = (0.4 * bonusAd) + (0.25 * stats.ap);
        const damage = base + scaling;
        const isAd = stats.ad > stats.ap + 100;
        const effectiveResist = getEffectiveResist(dummy, stats, isAd);
        return damage * getReduction(effectiveResist);
    }

    // Dark Harvest (ID: 8128)
    if (runeId === 8128) {
        const souls = 10;
        const base = 20 + (40 * (championLevel - 1) / 17) + (5 * souls);
        const scaling = (0.25 * bonusAd) + (0.15 * stats.ap);
        const damage = base + scaling;
        const isAd = stats.ad > stats.ap + 100;
        const effectiveResist = getEffectiveResist(dummy, stats, isAd);
        return damage * getReduction(effectiveResist);
    }

    // Comet (ID: 8229)
    if (runeId === 8229) {
        const base = 30 + (70 * (championLevel - 1) / 17);
        const scaling = (0.35 * bonusAd) + (0.20 * stats.ap);
        const damage = base + scaling;
        const effectiveResist = getEffectiveResist(dummy, stats, false);
        return damage * getReduction(effectiveResist);
    }

    // Aery (ID: 8214)
    if (runeId === 8214) {
        const base = 10 + (30 * (championLevel - 1) / 17);
        const scaling = (0.15 * bonusAd) + (0.10 * stats.ap);
        const damage = base + scaling;
        const effectiveResist = getEffectiveResist(dummy, stats, false);
        return damage * getReduction(effectiveResist);
    }

    // Press the Attack (ID: 8005)
    if (runeId === 8005) {
        const base = 40 + (140 * (championLevel - 1) / 17);
        const damage = base;
        const isAd = stats.ad > stats.ap;
        const effectiveResist = getEffectiveResist(dummy, stats, isAd);
        return damage * getReduction(effectiveResist);
    }

    return 0;
};

export const calculateAutoDamage = (stats: Stats, dummy: { armor: number, mr: number }) => {
    const effectiveArmor = getEffectiveResist(dummy, stats, true);
    return stats.ad * getReduction(effectiveArmor);
};

export const getRuneRow = (rId: number | null, subStyle: any) => {
    if (!rId || !subStyle) return -1;
    return subStyle.slots.findIndex((s: any) => s.runes.some((r: any) => r.id === rId));
};

export const calculateNewSecondaryPerks = (runeId: number, currentPerks: (number | null)[], subStyle: any) => {
    let next = [...currentPerks];
    const targetRow = getRuneRow(runeId, subStyle);
    const isSelected = currentPerks.includes(runeId);

    if (isSelected) {
        // Deselect
        next = next.map(id => id === runeId ? null : id);
        // Shift to fill gap
        if (next[0] === null && next[1] !== null) {
            next[0] = next[1];
            next[1] = null;
        }
    } else {
        // Check if we already have a rune from this row
        const existingIndexInRow = next.findIndex(id => getRuneRow(id, subStyle) === targetRow);

        if (existingIndexInRow !== -1) {
            // Replace the rune in the same row
            next[existingIndexInRow] = runeId;
        } else {
            // No rune from this row. Add to first empty, or shift if full.
            if (next[0] === null) {
                next[0] = runeId;
            } else if (next[1] === null) {
                next[1] = runeId;
            } else {
                // Both full, different rows. Shift: Remove first, add new to second.
                next[0] = next[1];
                next[1] = runeId;
            }
        }
    }
    return next;
};

export const cleanRuneData = (data: any[]) => {
    const REMOVED_IDS = [8134, 8124, 8008];
    return data.map((style: any) => ({
        ...style,
        slots: style.slots.map((slot: any) => ({
            ...slot,
            runes: slot.runes.filter((rune: any) => !REMOVED_IDS.includes(rune.id))
        }))
    }));
};
