import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import statsLib from '../lib/calculations/stats';

export type ItemData = {
  id: string;
  name?: string;
  image?: string;
  stats?: Record<string, number>;
  gold?: { base?: number; total?: number; sell?: number } | any;
};

export type ItemSlot = { id: string | null; data?: ItemData | null };
export type Shard = { slot: 'offense' | 'flex' | 'defense'; key: string; value: number };

export type RunePick = {
  id: string; // rune id
  slotIndex?: number; // row index 0..2
};

type RunesState = {
  primaryTreeId?: string | null;
  keystoneId?: string | null;
  primarySelections: (string | null)[]; // length 3, one per row (non-keystone rows)
  secondaryTreeId?: string | null;
  secondarySelections: { slotIndex: number; runeId: string }[]; // exactly 2 picks
  shards: { offense?: string; flex?: string; defense?: string };
};

export type Stats = {
  hp: number;
  ad: number;
  ap: number;
  armor: number;
  mr: number;
  as: number;
  crit: number;
  haste: number;
  mp: number; // current/max mana
  mp_s: number; // mana regen per second
};

type BuildState = {
  patch?: string | null;
  champion: { id: string | null; key?: string | null; name?: string | null; stats?: any; image?: string | null };
  level: number;
  championLevel: number;
  items: ItemSlot[]; // 6
  runes: RunesState;
  computedStats: Stats;
  locale: string;
  totalGoldCost: number;
  spells?: any[];
  spellRanks?: Record<string, number>;
  setSpells: (sp: any[]) => void;
  setChampionLevel: (lvl: number) => void;
  setSpellRank: (spellId: string, rank: number) => void;

  // actions
  setChampion: (champ: { id: string; key?: string; name?: string; stats?: any; image?: string | null }) => void;
  setPatch: (p: string | null) => void;
  setLocale: (l: string) => void;
  setLevel: (lvl: number) => void;
  setItemInSlot: (slotIndex: number, item: ItemData | null) => void;
  swapItems: (a: number, b: number) => void;
  removeItem: (slotIndex: number) => void;
  clearBuild: () => void;
  clearAllItems: () => void;

  // runes actions
  setPrimaryTree: (treeId: string | null) => void;
  setPrimaryKeystone: (runeId: string | null) => void;
  setPrimaryPick: (rowIndex: number, runeId: string | null) => void;
  setSecondaryTree: (treeId: string | null) => void;
  toggleSecondaryPick: (rowIndex: number, runeId: string) => void;
  setShard: (slot: 'offense'|'flex'|'defense', key: string) => void;

  exportBuild: () => string;
  importBuild: (json: string) => boolean;

  // internal
  recompute: () => void;

  // click-to-place fallback
  pickPanelItem: any | null;
  pickPanelItemAction: (it: any | null) => void;
};

const defaultStats: Stats = { hp: 0, ad: 0, ap: 0, armor: 0, mr: 0, as: 0, crit: 0, haste: 0, mp: 0, mp_s: 0 };

export const useBuildStore = create(immer<BuildState>((set, get) => {
  // helper to compute stats directly on draft to avoid nested set
  function computeDraftStats(draft: any) {
    const level = draft.championLevel || draft.level || 1;
    const champData = draft.champion?.stats || null;
    const items = draft.items.map((it:any)=> it.data).filter(Boolean);
    const shards = draft.runes?.shards || {};

    const aggregated = statsLib.aggregateStats(champData, level, items, shards);

    // compute total gold
    let totalGold = 0;
    for (const slot of draft.items) {
      const it = slot.data;
      if (it && it.gold && typeof it.gold.total === 'number') totalGold += it.gold.total;
    }

    draft.computedStats = aggregated;
    draft.totalGoldCost = totalGold;
  }

  return ({
    patch: null,
    champion: { id: null, key: null, name: null, stats: null, image: null },
    level: 1,
    championLevel: 1,
    items: Array.from({ length: 6 }).map(() => ({ id: null, data: null })),
    runes: { primaryTreeId: null, keystoneId: null, primarySelections: [null, null, null], secondaryTreeId: null, secondarySelections: [], shards: {} },
    computedStats: defaultStats,
    // Use a stable default 'en' during SSR to avoid hydration mismatches.
    // The real persisted locale (from localStorage) will be loaded client-side
    // by components (LanguageSwitcher) and applied via setLocale.
    locale: 'en',
    // localeVersion kept for forcing refetches when locale changes externally
    totalGoldCost: 0,
    spells: [],
    spellRanks: {},

    setChampion: (champ) => set((draft:any) => { draft.champion = champ; computeDraftStats(draft); }),
    setPatch: (p) => set((draft:any) => { draft.patch = p; }),
    setLocale: (l) => set((draft:any) => { draft.locale = l; try { if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') localStorage.setItem('locale', l); } catch {} draft.localeVersion = (draft.localeVersion || 0) + 1; }),
    setLevel: (lvl) => set((draft:any) => { draft.level = Math.max(1, Math.min(18, lvl)); computeDraftStats(draft); }),
    setChampionLevel: (lvl) => set((draft:any) => { draft.championLevel = Math.max(1, Math.min(18, lvl)); computeDraftStats(draft); }),
    setItemInSlot: (slotIndex, item) => set((draft:any) => { console.log('[STORE] setItemInSlot called', { slotIndex, item }); if (draft.items[slotIndex]) { draft.items[slotIndex].id = item ? item.id : null; draft.items[slotIndex].data = item; } computeDraftStats(draft); try { if (typeof window !== 'undefined' && window.document) { window.document.dispatchEvent(new CustomEvent('lolbuilder:item:set', { detail: { slotIndex, item } })); } } catch(e){} }),
    swapItems: (a,b) => set((draft:any) => { const tmp = draft.items[a]; draft.items[a] = draft.items[b]; draft.items[b] = tmp; computeDraftStats(draft); }),
    removeItem: (slotIndex) => set((draft:any) => { if (draft.items[slotIndex]) { draft.items[slotIndex].id = null; draft.items[slotIndex].data = null; } computeDraftStats(draft); }),
    clearBuild: () => set((draft:any) => { draft.champion = { id: null, key: null, name: null, stats: null, image: null }; draft.level = 1; draft.items = Array.from({ length: 6 }).map(() => ({ id: null, data: null })); draft.runes = { primaryTreeId: null, keystoneId: null, primarySelections: [null, null, null], secondaryTreeId: null, secondarySelections: [], shards: {} }; draft.computedStats = { ...defaultStats }; }),
    clearAllItems: () => set((draft:any) => { draft.items = Array.from({ length: 6 }).map(() => ({ id: null, data: null })); computeDraftStats(draft); }),

    setPrimaryTree: (treeId) => set((draft:any) => { draft.runes.primaryTreeId = treeId; draft.runes.keystoneId = null; draft.runes.primarySelections = [null, null, null]; computeDraftStats(draft); }),
    setPrimaryKeystone: (runeId) => set((draft:any) => { draft.runes.keystoneId = runeId; computeDraftStats(draft); }),
    setPrimaryPick: (rowIndex, runeId) => set((draft:any) => { if (rowIndex >= 0 && rowIndex < 3) {
      // immutable replace to ensure subscribers detect change
      const prev = draft.runes.primarySelections || [null, null, null];
      draft.runes.primarySelections = prev.map((v:any, i:number)=> i===rowIndex ? runeId : v);
      computeDraftStats(draft);
    } }),
    setSecondaryTree: (treeId) => set((draft:any) => { draft.runes.secondaryTreeId = treeId; draft.runes.secondarySelections = []; computeDraftStats(draft); }),
    toggleSecondaryPick: (rowIndex, runeId) => set((draft:any) => {
      const prev = draft.runes.secondarySelections || [];
      const existsIndex = prev.findIndex((s:any) => s.runeId === runeId);
      let next = [...prev];
      if (existsIndex !== -1) {
        next = prev.filter((s:any) => s.runeId !== runeId);
      } else {
        // if same row already selected, remove it
        next = prev.filter((s:any) => s.slotIndex !== rowIndex);
        if (next.length < 2) {
          next = [...next, { slotIndex: rowIndex, runeId }];
        }
      }
      draft.runes.secondarySelections = next;
      computeDraftStats(draft);
    }),
    setShard: (slot, key) => set((draft:any) => { draft.runes.shards[slot] = key; computeDraftStats(draft); }),

    setSpells: (sp: any[]) => set((draft:any) => { draft.spells = sp || []; // initialize spellRanks if missing
      if (sp && Array.isArray(sp)) {
        for (const s of sp) {
          if (!draft.spellRanks) draft.spellRanks = {};
          draft.spellRanks[s.id] = Math.min(s.maxRank || 1, Math.max(1, draft.spellRanks[s.id] || 1));
        }
      }
    }),
    setSpellRank: (spellId, rank) => set((draft:any) => { if (!draft.spellRanks) draft.spellRanks = {}; draft.spellRanks[spellId] = rank; computeDraftStats(draft); }),

    exportBuild: () => {
      const s = get();
      const payload = {
        patch: s.patch,
        locale: s.locale,
        totalGoldCost: s.totalGoldCost,
        champion: s.champion,
        level: s.level,
        championLevel: s.championLevel,
        items: s.items.map(it => ({ id: it.id, data: it.data })),
        runes: s.runes,
        spells: s.spells || [],
        spellRanks: s.spellRanks || {}
      };
      return JSON.stringify(payload);
    },

    importBuild: (json) => {
      try {
        const parsed = JSON.parse(json);
        set((draft:any) => {
          draft.patch = parsed.patch || draft.patch;
          draft.locale = parsed.locale || draft.locale;
          draft.champion = parsed.champion || { id: null, key: null, name: null, stats: null, image: null };
          draft.level = parsed.level || 1;
          draft.championLevel = parsed.championLevel || 1;
          draft.items = (parsed.items || Array.from({ length: 6 }).map(() => ({ id: null, data: null }))).map((it: any) => ({ id: it.id || null, data: it.data || null }));
          draft.runes = parsed.runes || { primaryTreeId: null, keystoneId: null, primarySelections: [null, null, null], secondaryTreeId: null, secondarySelections: [], shards: {} };
          draft.spells = parsed.spells || draft.spells || [];
          draft.spellRanks = parsed.spellRanks || draft.spellRanks || {};
          computeDraftStats(draft);
        });
        return true;
      } catch (err) {
        return false;
      }
    },

    recompute: () => {
      set((draft:any) => { computeDraftStats(draft); });
    },

    pickPanelItem: null,
    pickPanelItemAction: (it:any|null) => set((draft:any)=>{ draft.pickPanelItem = it; }),

    // existing actions
  });
}));

export default useBuildStore;
