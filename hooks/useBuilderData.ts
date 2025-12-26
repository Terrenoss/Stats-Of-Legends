import { useState, useEffect } from 'react';
import { Champion, Item } from '../types';
import { getChampionIconUrl, getItemIconUrl, getSpellIconUrl } from '../utils/ddragon';
import { transformChampionData, transformItemData } from '../utils/builderUtils';

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
                    const champs = transformChampionData(champJson);
                    setChampions(champs);
                }

                if (itemRes.ok) {
                    const itemJson = await itemRes.json();
                    const its = transformItemData(itemJson);
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
