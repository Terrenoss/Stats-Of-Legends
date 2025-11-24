'use client';
import React from 'react';
import useBuildStore from '@/stores/useBuildStore';
import { statModIconUrl } from '@/lib/dd/imageUrl';

const OFFENSE = [
  { key: 'adaptive_force', icon: 'statmodsadaptiveforceicon.png', label: 'Adaptive' },
  { key: 'attack_speed', icon: 'statmodsattackspeedicon.png', label: 'Attack Speed' },
  // use cdr scaling icon as primary fallback for ability haste (CommunityDragon naming varies)
  { key: 'ability_haste', icon: 'statmodscdrscalingicon.png', label: 'Haste' }
];
const FLEX = [
  { key: 'adaptive_force', icon: 'statmodsadaptiveforceicon.png', label: 'Adaptive' },
  { key: 'armor', icon: 'statmodsarmoricon.png', label: 'Armor' },
  { key: 'magic_resist', icon: 'statmodsmagicresicon.png', label: 'MR' }
];
const DEF = [
  { key: 'hp', icon: 'statmodshealthplusicon.png', label: 'HP' },
  { key: 'armor', icon: 'statmodsarmoricon.png', label: 'Armor' },
  { key: 'magic_resist', icon: 'statmodsmagicresicon.png', label: 'MR' }
];

export default function ShardsGrid(){
  const shards = useBuildStore(s => s.runes.shards || {});
  const setShard = useBuildStore(s => s.setShard);

  function renderRow(items:any[], lane:'offense'|'flex'|'defense'){
    return (
      <div className="flex justify-center gap-3 mb-2">
        {items.map((it:any)=> (
          <button key={it.key} onClick={()=>setShard(lane, it.key)} className={`w-12 h-12 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center ${shards[lane]===it.key ? 'ring-2 ring-emerald-400' : ''}`} title={it.label}>
            <img src={statModIconUrl(it.icon)} alt={it.label} className="w-7 h-7" onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src = statModIconUrl('statmodscdrscalingicon.png'); }} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-3 rounded">
      <div className="text-xs mb-2">Offense</div>
      {renderRow(OFFENSE, 'offense')}
      <div className="text-xs mb-2">Flex</div>
      {renderRow(FLEX, 'flex')}
      <div className="text-xs mb-2">Defense</div>
      {renderRow(DEF, 'defense')}
    </div>
  );
}
