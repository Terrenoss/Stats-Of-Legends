'use client';
import React, { useState, useRef } from 'react';
import ChampionSelect from '@/components/ChampionSelect/ChampionSelect';
import RunesBuilder from '@/components/RunesBuilder/RunesBuilder';
import ItemPanel from '@/components/Items/ItemPanel';
import ItemSlots from '@/components/Items/ItemSlots';
import StatSummary from '@/components/StatSummary/StatSummary';
import BuildControls from '@/components/BuildControls/BuildControls';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import useBuildStore from '@/stores/useBuildStore';
import PatchBanner from './PatchBanner';

import { DndContext, DragEndEvent, DragStartEvent, DragCancelEvent, DragOverEvent, useSensor, useSensors, PointerSensor, DragOverlay, rectIntersection } from '@dnd-kit/core';
import { itemIconUrl } from '@/lib/dd/imageUrl';
import DragOverlayItem from '@/components/Items/DragOverlayItem';

export default function MainApp(){
  const setItemInSlot = useBuildStore(s => s.setItemInSlot);
  const swapItems = useBuildStore(s => s.swapItems);
  const removeItem = useBuildStore(s => s.removeItem);
  const items = useBuildStore(s => s.items);
  const patch = useBuildStore(s => s.patch);

  const [activeData, setActiveData] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayItem, setOverlayItem] = useState<any>(null);
  // overId: track current over id centrally to drive highlights reliably
  const [overId, setOverId] = useState<string | null>(null);

  // diagnostic counter for mutations during a drag cycle (dev-only guard)
  const slotsMutationsRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  React.useEffect(()=>{
    function onForceAssign(e:any){
      try{
        const d = e.detail || {};
        const idx = Number(d.slotIndex);
        const item = d.item;
        if (!Number.isNaN(idx) && idx >= 0 && idx < 6 && item){
          useBuildStore.getState().setItemInSlot(idx, item);
        }
      } catch(err){ /* ignore */ }
    }
    window.addEventListener('lolbuilder:force-assign', onForceAssign as EventListener);
    return ()=> window.removeEventListener('lolbuilder:force-assign', onForceAssign as EventListener);
  }, []);

  function unwrap(obj:any){
    if (!obj) return null;
    let cur = obj;
    for (let i=0;i<8;i++){
      if (!cur) return null;
      if (cur.source || cur.item || cur.id) return cur;
      if (typeof cur.current !== 'undefined') cur = cur.current;
      else break;
    }
    return cur;
  }

  function onDragStart(event: DragStartEvent){
    // reset mutation counter at the start of a drag
    slotsMutationsRef.current = 0;

    const id = event.active?.id ? String(event.active.id) : null;
    const raw = event.active && (event.active.data as any) ? (event.active.data as any) : null;
    const parsed = unwrap(raw) || null;
    setActiveId(id || null);

    // fallback parse of id to minimal activeData
    let parsedUnwrapped = parsed || null;
    if (!parsedUnwrapped && id){
      if (id.startsWith('catalog-item-')){
        const iid = id.replace('catalog-item-','');
        parsedUnwrapped = { source: 'catalog', item: { id: iid, name: iid }, patch };
      } else if (id.startsWith('slot-item-')){
        const idx = Number(id.replace('slot-item-',''));
        parsedUnwrapped = { source: 'slot', index: idx, item: items[idx]?.data, patch };
      }
    }
    setActiveData(parsedUnwrapped);
    try { document.dispatchEvent(new CustomEvent('lolbuilder:tooltip:hide')); } catch(e){}

    // reset central over state on drag start
    setOverId(null);
  }

  function onDragOver(e: DragOverEvent){
    // centrally track the id we're currently over (used by ItemSlots to drive visuals)
    const oId = e.over?.id ? String(e.over.id) : null;
    setOverId(oId);
    // keep existing event dispatch for compatibility with listeners
    try { document.dispatchEvent(new CustomEvent('lolbuilder:dnd:over', { detail: { overId: oId } })); } catch(e){}
  }

  function onDragEnd(event: DragEndEvent){
    const active = event.active;
    const over = event.over;
    const aid = active?.id ? String(active.id) : null;
    const targetOverId = over?.id ? String(over.id) : null;

    // robustly extract minimal aData
    const rawBase = active && (active.data as any) ? (active.data as any) : null;
    let aData = unwrap(rawBase) || activeData || null;

    // final fallback to parse id
    if (!aData && aid){
      if (aid.startsWith('catalog-item-')){
        const iid = aid.replace('catalog-item-','');
        aData = { source: 'catalog', item: { id: iid, name: iid }, patch };
      } else if (aid.startsWith('slot-item-')){
        const idx = Number(aid.replace('slot-item-',''));
        aData = { source: 'slot', index: idx, item: items[idx]?.data, patch };
      }
    }

    if (!aData){ setActiveData(null); setActiveId(null); setOverId(null); return; }

    function normalizeForSlot(it:any){ if (!it) return null; return { id: it.id ?? String(it.id||''), name: it.name || String(it.id||''), image: it.imageFull || it.image || `${it.id}.png`, stats: it.stats || {}, gold: it.gold || {} }; }

    if (aData.source === 'catalog'){
      const norm = normalizeForSlot(aData.item);
      if (targetOverId === 'items-container'){
        const firstEmpty = items.findIndex((x:any)=>!x || !x.id);
        if (firstEmpty >= 0){
          // schedule mutation and increment counter
          slotsMutationsRef.current++;
          requestAnimationFrame(()=>{ useBuildStore.getState().setItemInSlot(firstEmpty, norm); try{ document.dispatchEvent(new CustomEvent('lolbuilder:item:set',{detail:{slotIndex:firstEmpty,item:norm}})); }catch(e){} });
        }
      } else if (targetOverId && targetOverId.startsWith('slot-')){
        const idx = Number(targetOverId.replace('slot-',''));
        slotsMutationsRef.current++;
        requestAnimationFrame(()=>{ useBuildStore.getState().setItemInSlot(idx, norm); try{ document.dispatchEvent(new CustomEvent('lolbuilder:item:set',{detail:{slotIndex:idx,item:norm}})); }catch(e){} });
      }
    } else if (aData.source === 'slot'){
      const fromIndex = aData.index;
      if (targetOverId && targetOverId.startsWith('slot-')){
        const toIndex = Number(targetOverId.replace('slot-',''));
        if (!Number.isNaN(toIndex) && toIndex !== fromIndex){
          slotsMutationsRef.current++;
          requestAnimationFrame(()=>{ swapItems(fromIndex, toIndex); });
        }
      } else if (!targetOverId){
        slotsMutationsRef.current++;
        requestAnimationFrame(()=>{ removeItem(fromIndex); });
      }
    }

    // dev diagnostic: log number of scheduled slot mutations in this drag cycle (should be ≤1)
    try { console.debug('[Diag] slots mutations scheduled this drag:', slotsMutationsRef.current); } catch(e){}

    setActiveData(null);
    setActiveId(null);
    setOverId(null);
    try { document.dispatchEvent(new CustomEvent('lolbuilder:tooltip:hide')); } catch(e){}
  }

  function onDragCancel(e: DragCancelEvent){ setActiveData(null); setActiveId(null); setOverId(null); }

  // compute overlayItem via effect, but avoid setState loops: only set when activeId or activeData changes
  React.useEffect(()=>{
    let mounted = true;
    let overlay = activeData?.item || null;
    if (!overlay && activeId){ // minimal DOM fallback
      try{
        const el = document.querySelector(`[data-draggable="${activeId}"]`) as HTMLElement | null;
        if (el){
          const name = el.getAttribute('data-item-name') || undefined;
          const image = el.getAttribute('data-item-image') || undefined;
          overlay = { id: activeId.replace('catalog-item-','').replace('slot-item-',''), name, imageFull: image };
        }
      }catch(err){/* ignore */}
    }
    if (mounted) setOverlayItem(overlay);
    return ()=>{ mounted=false; setOverlayItem(null); };
  }, [activeId, activeData]);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel} collisionDetection={rectIntersection}>
      <div className="container grid gap-4 grid-cols-1 md:grid-cols-12">
        <div className="col-span-full flex justify-end mb-2 items-center gap-3">
          <LanguageSwitcher />
        </div>

        <div className="md:col-span-3 bg-neutral-800 p-3 rounded">
          <h3 className="text-lg font-semibold mb-2">Champion & Runes</h3>
          <ChampionSelect />
          <div className="mt-4"><RunesBuilder /></div>
        </div>

        <div className="md:col-span-6 bg-neutral-800 p-3 rounded">
          <h3 className="text-lg font-semibold mb-2">Items</h3>
          <div className="flex gap-4">
            <div className="w-1/2"><ItemPanel /></div>
            <div className="w-1/2"><ItemSlots overId={overId} /></div>
          </div>
        </div>

        <div className="md:col-span-3 bg-neutral-800 p-3 rounded">
          <h3 className="text-lg font-semibold mb-2">Stats & Export</h3>
          <StatSummary />
          <div className="mt-4"><BuildControls /></div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150 }}>
        {activeId ? (
          <DragOverlayItem patch={patch || 'latest'} item={overlayItem} source={activeData?.source || (activeId?.startsWith('catalog-item-') ? 'catalog' : (activeId?.startsWith('slot-item-') ? 'slot' : 'unknown'))} />
        ) : null}
      </DragOverlay>

      <PatchBanner />
    </DndContext>
  );
}
