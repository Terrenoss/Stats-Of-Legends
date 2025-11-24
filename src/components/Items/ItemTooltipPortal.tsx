'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import useBuildStore from '@/stores/useBuildStore';
import { itemIconUrl } from '@/lib/dd/imageUrl';

function stripHtml(input: string | undefined){
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g,' ').trim();
}

const STAT_LABELS: Record<string,string> = {
  FlatHPPoolMod: 'HP',
  FlatPhysicalDamageMod: 'AD',
  FlatAbilityPowerMod: 'AP',
  FlatArmorMod: 'Armor',
  FlatSpellBlockMod: 'MR',
  FlatAttackSpeedMod: 'AS',
  FlatCritChanceMod: 'Crit',
  FlatMPPoolMod: 'Mana',
  FlatMPRegenMod: 'MP/s'
};

const STAT_LABELS_FULL: Record<string,string> = {
  FlatHPPoolMod: 'HP',
  FlatPhysicalDamageMod: 'AD',
  FlatAttackDamageMod: 'AD',
  FlatMagicDamageMod: 'AP',
  FlatAbilityPowerMod: 'AP',
  FlatArmorMod: 'Armor',
  FlatSpellBlockMod: 'MR',
  FlatAttackSpeedMod: 'AS (flat)',
  PercentAttackSpeedMod: 'AS %',
  FlatCritChanceMod: 'Crit %',
  FlatMPPoolMod: 'Mana',
  FlatMPRegenMod: 'MP/s',
  FlatAbilityHasteMod: 'Ability Haste'
};

function fmt(n: any) {
  if (typeof n === 'number') return n.toLocaleString();
  return String(n);
}

export default function ItemTooltipPortal({ visible, item, pos }: { visible: boolean; item: any; pos: {x:number,y:number} }){
  const patch = useBuildStore(s => s.patch);
  if (!visible || !item) return null;
  if (typeof window === 'undefined') return null;
  const el = document.body;

  const tooltipWidth = 320; // approximate width
  const tooltipHeight = 180; // approximate
  let left = pos.x + 12;
  let top = pos.y + 12;
  const margin = 12;
  // clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left + tooltipWidth + margin > vw) left = Math.max(margin, vw - tooltipWidth - margin);
  if (top + tooltipHeight + margin > vh) top = Math.max(margin, vh - tooltipHeight - margin);

  const style: React.CSSProperties = { position: 'fixed', left, top, zIndex: 9999 };
  const gold = item.gold || {};

  // compute image src: if item.image looks like a filename, convert to CDN using patch
  let imgSrc = '';
  if (item.image) {
    if (String(item.image).startsWith('http')) imgSrc = item.image;
    else imgSrc = itemIconUrl(patch || 'latest', String(item.image));
  } else if (item.imageFull) {
    imgSrc = itemIconUrl(patch || 'latest', String(item.imageFull));
  } else if (item.id) {
    imgSrc = itemIconUrl(patch || 'latest', `${item.id}.png`);
  }

  function extractPassives(text: string){
    if (!text) return '';
    // try to extract lines with 'Passive' or 'UNIQUE' or 'Active'
    const cleaned = stripHtml(text);
    const lines = cleaned.split(/\.|\n/).map(s=>s.trim()).filter(Boolean);
    // return first 3 sentences that contain passive/unique/active keywords or otherwise first 2 lines
    const candidates = lines.filter(l => /passive|unique|active|on hit|on use/i.test(l));
    if (candidates.length > 0) return candidates.slice(0,3).join('. ')+'.';
    return lines.slice(0,3).join('. ') + (lines.length>3? '...' : '');
  }

  const passiveText = extractPassives(item.description || item.plaintext || '');

  return createPortal(
    <div style={style} className="bg-slate-900 p-3 rounded border border-slate-700 shadow-lg w-80 pointer-events-none">
      <div className="flex items-start gap-3">
        {imgSrc && <img src={imgSrc} alt={item.name} className="w-10 h-10 object-contain" onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src = itemIconUrl(patch || 'latest', (item.imageFull || (item.image) || (item.id ? `${item.id}.png` : ''))); }} />}
        <div>
          <div className="text-sm font-semibold">{item.name}</div>
          <div className="text-xs text-neutral-400">{stripHtml(item.description || item.plaintext || '')}</div>
        </div>
      </div>

      <div className="mt-2 text-[13px]">Stats:</div>
      <div className="text-[12px] text-neutral-300 space-y-0.5 max-h-32 overflow-auto">
        {item.stats && Object.entries(item.stats).length > 0 ? (
          Object.entries(item.stats).map(([k,v])=> {
            let label = STAT_LABELS_FULL[k] || STAT_LABELS[k] || k;
            // convert MP regen per 5s to per second
            if (k === 'FlatMPRegenMod') {
              const perSecond = (Number(v) || 0) / 5;
              return (<div key={k}>{label}: {fmt(Number(perSecond).toFixed(2))} /s</div>);
            }
            // crit fraction to percent
            if (k === 'FlatCritChanceMod' && typeof v === 'number' && v > 0 && v <= 1) {
              return (<div key={k}>{label}: {fmt((v * 100).toFixed(1))}%</div>);
            }
            return (<div key={k}>{label}: {fmt(v)}</div>);
          })
        ) : (
          <div className="text-neutral-500">No stats</div>
        )}
      </div>

      <div className="mt-2 text-[13px]">Gold:</div>
      <div className="text-[12px] text-neutral-300">Base: <strong>{fmt(gold.base ?? '0')}</strong> | Total: <strong>{fmt(gold.total ?? '0')}</strong> | Sell: <strong>{fmt(gold.sell ?? '0')}</strong></div>

      {passiveText && (
        <div className="mt-2 text-[12px] text-neutral-200 bg-slate-800 p-2 rounded">{passiveText}</div>
      )}

      {item.plaintext && (
        <div className="mt-2 text-[12px] text-neutral-300">{stripHtml(item.plaintext)}</div>
      )}
    </div>
  , el);
}
