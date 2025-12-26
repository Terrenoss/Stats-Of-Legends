import { useState, useEffect } from 'react';
import { Champion, Item } from '../types';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl } from '../utils/ddragon';

export function useBuilderData() {
    const [champions, setChampions] = useState<Champion[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
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
                            ? getChampionIconUrl(c.imageFull, patch)
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
                                ? getSpellIconUrl(s.imageFull, patch)
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
                }

                if (itemRes.ok) {
                    const itemJson = await itemRes.json();
                    const patch = itemJson.patch || 'latest';
                    const its: Item[] = (itemJson.data || []).map((it: any) => ({
                        id: Number(it.id),
                        name: it.name,
                        imageUrl: it.imageFull
                            ? getItemIconUrl(it.imageFull, patch)
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
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return { champions, items, loading, error };
}
