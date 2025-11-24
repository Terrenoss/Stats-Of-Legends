'use client';
import React from 'react';
import useBuildStore from '@/stores/useBuildStore';
import { championIconUrl } from '@/lib/dd/imageUrl';
import { statModIconUrl } from '@/lib/dd/imageUrl';
import { calcSpellDamageFromSpell, damageAfterArmor, damageAfterMR } from '@/lib/calculations/spell';

export default function StatSummary(){
  const stats = useBuildStore(s => s.computedStats);
  const champ = useBuildStore(s => s.champion);
  const patch = useBuildStore(s => s.patch);
  const championLevel = useBuildStore(s => s.championLevel);
  const setChampionLevel = useBuildStore(s => s.setChampionLevel);
  const spells = useBuildStore(s => s.spells || []);
  const spellRanks = useBuildStore(s => s.spellRanks || {});
  const setSpellRank = useBuildStore(s => s.setSpellRank);

  function StatRow({icon, label, value}:{icon:string,label:string,value:any}){
    return (
      <div className="flex items-center gap-2">
        <img src={statModIconUrl(icon)} className="w-5 h-5" alt={label} crossOrigin="anonymous" />
        <div className="ml-2 text-sm">{label}: <strong>{value}</strong></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-4 rounded">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 aspect-square overflow-hidden rounded">
          <img src={champ.image ? championIconUrl(patch || 'latest', champ.image) : championIconUrl(patch || 'latest', `${champ.id}.png`)} alt={champ.name || ''} className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="text-sm font-semibold">{champ.name || 'No champion'}</div>
          <div className="text-xs text-neutral-400">Level: <select className="bg-slate-800 px-2 py-0.5 rounded" value={championLevel} onChange={(e)=>setChampionLevel(Number(e.target.value))}>{Array.from({length:18},(_,i)=>i+1).map(n=> <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
      </div>

      <div className="space-y-2">
        <StatRow icon={'statmodshealthplusicon.png'} label={'HP'} value={stats.hp} />
        <StatRow icon={'statmodsattackdamageicon.png'} label={'AD'} value={stats.ad} />
        <StatRow icon={'statmodsabilitypowericon.png'} label={'AP'} value={stats.ap} />
        <StatRow icon={'statmodsarmoricon.png'} label={'Armor'} value={stats.armor} />
        <StatRow icon={'statmodsmagicresicon.png'} label={'MR'} value={stats.mr} />
        <StatRow icon={'statmodsattackspeedicon.png'} label={'AS'} value={stats.as} />
        <StatRow icon={'statmodsmanaicon.png'} label={'MP'} value={stats.mp} />
        <StatRow icon={'statmodsmanaicon.png'} label={'MP/s'} value={stats.mp_s} />
        <StatRow icon={'statmodscdrscalingicon.png'} label={'Haste'} value={stats.haste} />
        <StatRow icon={'statmodscriticalstrikechanceicon.png'} label={'Crit'} value={stats.crit} />
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold mb-2">Spells</div>
        <div className="space-y-3">
          {spells.map((sp:any, idx:number)=>{
            const id = sp.id || (`S${idx}`);
            const rank = spellRanks[id] || 1;
            const raw = calcSpellDamageFromSpell(stats, sp, rank);
            const after = sp.type === 'physical' ? damageAfterArmor(raw, stats.armor) : damageAfterMR(raw, stats.mr);
            return (
              <div key={id} className="bg-slate-800 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sp.icon && <img src={sp.icon} className="w-6 h-6" alt={sp.name} />}
                    <div className="text-sm font-medium">{sp.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-neutral-400">Rank</div>
                    <select className="bg-slate-700 px-2 py-0.5 rounded" value={rank} onChange={(e)=>setSpellRank(id, Number(e.target.value))}>
                      {Array.from({length: sp.maxRank || 5}).map((_,i)=> <option key={i} value={i+1}>{i+1}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2 text-xs text-neutral-300">{sp.description}</div>
                <div className="mt-2 text-xs">Raw: <strong>{Math.round(raw)}</strong> • After: <strong>{Math.round(after)}</strong></div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
