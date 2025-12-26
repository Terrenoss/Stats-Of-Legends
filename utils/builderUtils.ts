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
