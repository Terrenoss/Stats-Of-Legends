import { useState, useEffect } from 'react';
import { Champion, Item, Stats } from '../types';

export function useStatsCalculation(
    currentChampion: Champion | null,
    championLevel: number,
    selectedItems: (Item | null)[]
) {
    const [stats, setStats] = useState<Stats | null>(null);

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

    return stats;
}
