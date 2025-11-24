'use client';
import React, { useEffect, useState } from 'react';
import useBuildStore from '@/stores/useBuildStore';
import { fetchRunesClient } from '@/lib/api/dd';
import { runeIconUrl } from '@/lib/dd/imageUrl';
import ShardsGrid from './ShardsGrid';

type RuneTree = any;

export default function RunesBuilder(){
  const [trees, setTrees] = useState<RuneTree[]>([]);
  const primaryTreeId = useBuildStore(s=>s.runes.primaryTreeId);
  const secondaryTreeId = useBuildStore(s=>s.runes.secondaryTreeId);
  const keystoneId = useBuildStore(s=>s.runes.keystoneId);
  const primarySelections = useBuildStore(s=>s.runes.primarySelections);
  const secondarySelections = useBuildStore(s=>s.runes.secondarySelections);
  const setPrimaryTree = useBuildStore(s=>s.setPrimaryTree);
  const setPrimaryKeystone = useBuildStore(s=>s.setPrimaryKeystone);
  const setPrimaryPick = useBuildStore(s=>s.setPrimaryPick);
  const setSecondaryTree = useBuildStore(s=>s.setSecondaryTree);
  const toggleSecondaryPick = useBuildStore(s=>s.toggleSecondaryPick);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await fetchRunesClient();
        if (!mounted) return;
        const data = Array.isArray(res) ? res : (res?.data || res);
        setTrees(data || []);
      } catch(err){ setTrees([]); }
    })();
    return ()=>{ mounted=false };
  },[]);

  return (
    <div className="bg-slate-900 p-3 rounded">
      <div className="mb-2 text-sm font-semibold">Runes</div>
      <div className="mb-3">
        <div className="flex flex-wrap justify-center gap-3">
          {trees.map((t:any)=> (
            <button key={t.id} onClick={()=>setPrimaryTree(t.id)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${primaryTreeId===t.id? 'ring-2 ring-indigo-400' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <img src={runeIconUrl(t.icon)} alt={t.name} className="w-6 h-6" />
              <span className="text-sm">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        {/* Primary tree content */}
        {primaryTreeId && (
          <div className="bg-slate-800 p-3 rounded">
            <div className="text-sm font-semibold mb-2">Primary</div>
            {(() => {
              const tree = trees.find((tr:any)=>tr.id===primaryTreeId) || trees.find((tr:any)=>tr.key===primaryTreeId);
              if (!tree) return <div className="text-xs text-neutral-400">No tree selected</div>;
              // keystone is usually in slots[0]
              const keystoneSlot = tree.slots && tree.slots[0] ? tree.slots[0].runes : [];
              const rows = tree.slots && tree.slots.slice(1,4) || [];
              return (
                <div>
                  <div className="mb-2">
                    <div className="text-xs mb-1">Keystone</div>
                    <div className="flex justify-center gap-3">
                      {keystoneSlot.map((r:any, idx:number)=> (
                        <button key={r.id} onClick={()=>setPrimaryKeystone(r.id)} aria-pressed={keystoneId===r.id} className={`w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${keystoneId===r.id? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                          <img src={runeIconUrl(r.icon)} alt={r.name} className="w-8 h-8" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {rows.map((slot:any, rowIdx:number)=> (
                    <div key={rowIdx} className="mb-2">
                      <div className="text-xs mb-1">Row {rowIdx + 1}</div>
                      <div className="flex justify-center gap-3">
                        {slot.runes.map((r:any)=> (
                          <button key={r.id} onClick={()=>setPrimaryPick(rowIdx, r.id)} aria-pressed={primarySelections?.[rowIdx]===r.id} className={`w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${primarySelections?.[rowIdx]===r.id? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                            <img src={runeIconUrl(r.icon)} alt={r.name} className="w-8 h-8" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-sm font-semibold mb-2">Secondary</div>
        <div className="flex flex-wrap justify-center gap-3 mb-2">
          {trees.map((t:any)=> (
            <button key={t.id} onClick={()=>setSecondaryTree(t.id)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${secondaryTreeId===t.id? 'ring-2 ring-indigo-400' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <img src={runeIconUrl(t.icon)} alt={t.name} className="w-6 h-6" />
              <span className="text-sm">{t.name}</span>
            </button>
          ))}
        </div>
        {secondaryTreeId && (()=>{
          const tree = trees.find((tr:any)=>tr.id===secondaryTreeId) || trees.find((tr:any)=>tr.key===secondaryTreeId);
          if (!tree) return <div className="text-xs text-neutral-400">No tree selected</div>;
          const rows = tree.slots && tree.slots.slice(1,4) || [];
          return (
            <div className="bg-slate-800 p-3 rounded">
              <div className="text-xs mb-1">Pick exactly 2 runes on 2 different rows</div>
              {rows.map((slot:any, rowIdx:number)=> (
                <div key={rowIdx} className="mb-2">
                  <div className="text-xs mb-1">Row {rowIdx + 1}</div>
                  <div className="flex justify-center gap-3">
                    {slot.runes.map((r:any)=> (
                      <button key={r.id} onClick={()=>toggleSecondaryPick(rowIdx, r.id)} aria-pressed={Boolean(secondarySelections.find((s:any)=>s.runeId===r.id))} className={`w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${secondarySelections.find((s:any)=>s.runeId===r.id)? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                        <img src={runeIconUrl(r.icon)} alt={r.name} className="w-8 h-8" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Shards</div>
        <ShardsGrid />
      </div>
    </div>
  );
}
