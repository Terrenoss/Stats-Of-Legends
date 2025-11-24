'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { itemIconUrl } from '@/lib/dd/imageUrl';
import useBuildStore from '@/stores/useBuildStore';
import useItemTooltip from '@/hooks/useItemTooltip';
import ItemTooltipPortal from './ItemTooltipPortal';
import { fetchItemsClient, getManifestClient } from '@/lib/api/dd';
import DraggableItem from './DraggableItem';

export default function ItemPanel(){
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const setPatch = useBuildStore(s => s.setPatch);
  const tooltip = useItemTooltip();

  const locale = useBuildStore(s => s.locale);
  const patch = useBuildStore(s => s.patch);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const itemsRes = await fetchItemsClient(patch || 'latest', locale || 'en_US');
        if (!mounted) return;
        if ((itemsRes as any).patch) setPatch((itemsRes as any).patch);
        setItems((itemsRes as any).data || itemsRes || []);
      } catch (err){ setItems([]); }
    })();
    return ()=>{ mounted=false };
  },[setPatch, locale, patch]);

  async function retryFetch(){
    try{
      const m = await getManifestClient();
      const p = (m && (m.patch || m.latest)) || patch || undefined;
      const itemsRes = await fetchItemsClient(p || 'latest', locale || 'en_US');
      if (itemsRes && (itemsRes as any).patch) setPatch((itemsRes as any).patch);
      setItems((itemsRes as any).data || itemsRes || []);
    } catch (err){ console.warn('retry fetch items failed', err); }
  }

  const setItemInSlot = useBuildStore(s => s.setItemInSlot);
  const itemsState = useBuildStore(s => s.items);

  const filtered = useMemo(()=> items.filter(it=> it.name.toLowerCase().includes(q.toLowerCase())), [items, q]);

  function imageNameOf(it:any){
    if (!it) return '';
    return it.imageFull || (it.image && (typeof it.image === 'string' ? it.image : it.image.full || it.image.imageFull)) || (it.id ? `${it.id}.png` : '');
  }

  return (
    <div>
      <div className="mb-2 text-xs text-neutral-300">Loaded items: {items.length} • patch: {patch || 'latest'} • locale: {locale}</div>
      <div className="flex items-center gap-2 mb-3">
        <input name="itemSearch" className="flex-1 p-2 rounded bg-slate-800" placeholder="Rechercher items..." value={q} onChange={e=>setQ(e.target.value)} />
        <div className="text-[13px] text-neutral-400">{filtered.length} results</div>
        <button className="ml-2 px-2 py-1 bg-slate-700 rounded text-xs" onClick={retryFetch}>Retry</button>
      </div>

      <div className="max-h-64 overflow-y-auto overflow-x-hidden min-w-0 grid grid-cols-4 gap-3">
        {filtered.map(it => (
          <DraggableItem key={it.id} item={it} patch={patch || 'latest'} onHover={(it,x,y)=>tooltip.show(it,x,y)} onLeave={()=>tooltip.hide()} />
        ))}
      </div>

      <ItemTooltipPortal visible={tooltip.visible} item={tooltip.item} pos={tooltip.pos} />
    </div>
  );
}
