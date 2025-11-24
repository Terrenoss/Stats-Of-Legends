'use client';
import React, { useEffect, useState } from 'react';
import useBuildStore from '@/stores/useBuildStore';
import { championIconUrl } from '@/lib/dd/imageUrl';
import { getChampionSpellsClient, fetchChampionsClient } from '@/lib/api/dd';

type ChampionData = {
  id: string;
  name: string;
  key: string;
  tags?: string[];
  imageFull?: string;
  stats?: any;
};

export default function ChampionSelect() {
  const [list, setList] = useState<ChampionData[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const localeVersion = useBuildStore(s => (s as any).localeVersion || 0);
  const setChampion = useBuildStore(s => s.setChampion);
  const setPatch = useBuildStore(s => s.setPatch);
  const selected = useBuildStore(s => s.champion.id);

  const locale = useBuildStore(s => s.locale);
  const patch = useBuildStore(s => s.patch);

  useEffect(() => {
    let mounted = true;
    (async ()=>{
      try {
        const champions = await fetchChampionsClient(patch || 'latest', locale || 'en_US');
        if (!mounted) return;
        // API returns { patch, data }
        if ((champions as any).patch) setPatch((champions as any).patch);
        const items = (Array.isArray((champions as any).data) ? (champions as any).data : (champions as any))
          .map((c: any) => ({ id: c.id, name: c.name, key: c.key, tags: c.tags, imageFull: c.imageFull, stats: c.stats }));
        setList(items);
      } catch (err) {
        setList([]);
      }
    })();
    return () => { mounted = false };
  }, [setPatch, locale, patch]);

  useEffect(() => {
    // clear local filters when locale changes to avoid 0-results due to language mismatch
    setQ('');
    setRole('');
  }, [localeVersion]);

  const roles = Array.from(new Set(list.flatMap(l => l.tags || [])));
  const filtered = list.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) && (role ? (c.tags || []).includes(role) : true));

  async function onSelectChampion(c: any){
    setChampion({ id: c.id, key: c.key, name: c.name, stats: c.stats, image: c.imageFull });
    // fetch spells
    const spells = await getChampionSpellsClient(c.key, useBuildStore.getState().patch || 'latest');
    if (spells) useBuildStore.getState().setSpells(spells);
  }

  // debug info
  const loadedCount = list.length;

  return (
    <div>
      <div className="mb-2 text-xs text-neutral-300">Loaded champions: {loadedCount} • patch: {patch || 'latest'} • locale: {locale}</div>
      <div className="flex gap-2 mb-3">
        <input className="flex-1 p-2 rounded bg-slate-800" placeholder="Rechercher..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="p-2 rounded bg-slate-800" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Tous</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto overflow-x-hidden min-w-0">
        {filtered.map(c => {
          const src = championIconUrl(useBuildStore.getState().patch || 'latest', c.imageFull || `${c.id}.png`);
          return (
            <button key={c.id} onClick={() => onSelectChampion(c)} className={`p-3 rounded bg-slate-800 hover:bg-slate-700 flex flex-col items-center min-w-0 ${selected === c.id ? 'ring-2 ring-indigo-400' : ''}`}>
              <div className="w-12 h-12 aspect-square overflow-hidden rounded flex items-center justify-center">
                <img src={src} onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src = championIconUrl('latest', c.imageFull || `${c.id}.png`) }} alt={c.name} className="w-full h-full object-contain" />
              </div>
              <span className="text-[13px] mt-1 truncate w-full text-center">{c.name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="col-span-5 text-sm text-neutral-400">Aucun champion</div>}
      </div>
    </div>
  );
}
