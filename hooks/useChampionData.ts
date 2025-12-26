import { useState, useEffect } from 'react';
import { ChampionService } from '@/services/ChampionService';
import { CURRENT_PATCH } from '@/constants';

export function useChampionData(championName: string, role: string, rank: string) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [runeMap, setRuneMap] = useState<Record<number, string>>({});
    const [allRunes, setAllRunes] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await ChampionService.getChampionDetails(championName, role, rank);
                setData(res);

                // Fetch Rune Map
                try {
                    const patch = CURRENT_PATCH;
                    let runeRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`);

                    // Fallback to 14.23.1 if 403/404
                    if (!runeRes.ok) {
                        console.warn(`Failed to fetch runes for patch ${patch}, trying fallback 14.23.1`);
                        runeRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/14.23.1/data/en_US/runesReforged.json`);
                    }

                    if (runeRes.ok) {
                        const runeData = await runeRes.json();
                        setAllRunes(runeData); // Store full rune data
                        const map: Record<number, string> = {};

                        const processTree = (tree: any) => {
                            map[tree.id] = tree.icon;
                            tree.slots.forEach((slot: any) => {
                                slot.runes.forEach((rune: any) => {
                                    map[rune.id] = rune.icon;
                                });
                            });
                        };

                        runeData.forEach(processTree);
                        setRuneMap(map);
                    } else {
                        console.error('Failed to fetch runes (fallback also failed):', runeRes.status);
                    }
                } catch (runeError) {
                    console.error('Error loading runes:', runeError);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [championName, role, rank]);

    return { data, loading, runeMap, allRunes };
}
