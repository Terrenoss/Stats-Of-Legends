export type Rune = { id: number|string; key?: string; name: string; icon: string; shortDesc?: string };
export type RuneTree = { id: number|string; key?: string; name: string; icon: string; slots: { runes: Rune[] }[] };

export function parseRunesJson(json: any): RuneTree[] {
  if (!json || !Array.isArray(json)) return [];
  // runesReforged.json has trees; each tree has slots array with runes
  return json.map((tree: any) => ({
    id: tree.id || tree.key || tree.name,
    key: tree.key,
    name: tree.name,
    icon: tree.icon || tree.iconPath || '',
    slots: (tree.slots || []).map((slot: any) => ({ runes: (slot.runes || []).map((r:any)=>({ id: r.id || r.key || r.name, key: r.key, name: r.name, icon: r.icon || r.iconPath || '', shortDesc: r.shortDesc || r.longDesc || '' })) }))
  }));
}
