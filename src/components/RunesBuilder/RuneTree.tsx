'use client';
import React from 'react';
import { runeIconUrl } from '@/lib/dd/imageUrl';

export default function RuneTree({ tree, onKeystone, onPick, selected }: any){
  if (!tree) return null;
  const keystoneSlot = tree.slots && tree.slots[0] ? tree.slots[0].runes : [];
  const rows = tree.slots && tree.slots.slice(1,4) || [];

  return (
    <div>
      <div className="mb-2">
        <div className="text-xs mb-1">Keystone</div>
        <div className="flex justify-center gap-3">
          {keystoneSlot.map((r:any)=> (
            <button key={r.id} onClick={()=>onKeystone(r)} className={`w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${selected.keystoneId===r.id? 'ring-2 ring-amber-400' : ''}`}>
              <img src={runeIconUrl(r.icon)} alt={r.name} className="w-8 h-8" />
            </button>
          ))}
        </div>
      </div>

      {rows.map((slot:any, idx:number)=> (
        <div key={idx} className="mb-2">
          <div className="text-xs mb-1">Row {idx + 1}</div>
          <div className="flex justify-center gap-3">
            {slot.runes.map((r:any)=> (
              <button key={r.id} onClick={()=>onPick(idx, r)} className={`w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${selected.primarySelections?.[idx]===r.id? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                <img src={runeIconUrl(r.icon)} alt={r.name} className="w-8 h-8" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

