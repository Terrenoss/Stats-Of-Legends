'use client';
import React from 'react';
import useBuildStore from '@/stores/useBuildStore';
import { itemIconUrl } from '@/lib/dd/imageUrl';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';

type ItemSlotType = { id: string | null; data?: any | null };

function SortableSlotItem({ index, item, patch }: { index: number; item: any; patch: string }){
  const sortableId = `slot-item-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId, data: { current: { source: 'slot', index, item: item?.data || item, patch } } });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    touchAction: 'none',
  };
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="flex flex-col items-center cursor-grab" style={style} data-slot-item-id={sortableId}>
      <div className="w-12 h-12 flex items-center justify-center">
        <img alt={`item-${item.id}`} src={item.data?.image ? itemIconUrl(patch || 'latest', item.data.image) : itemIconUrl(patch || 'latest', `${item.id}.png`)} className="w-12 h-12 object-contain" onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src = itemIconUrl(patch || 'latest', `${item.id}.png`) }} />
      </div>
      <button className="text-xs text-red-400 mt-1" onClick={(e)=>{ e.stopPropagation(); useBuildStore.getState().removeItem(index); }}>Suppr</button>
    </div>
  );
}

function SlotEmpty(){
  return <div className="text-sm text-neutral-400">Vide</div>;
}

function Slot({ s, i, patch, highlight, isOverGlobal }: { s: ItemSlotType; i: number; patch: string; highlight?: boolean; isOverGlobal?: boolean }){
  // droppable wrapper for the slot area
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${i}` });
  const ring = isOver || isOverGlobal || highlight ? 'ring-4 ring-emerald-400/70 ring-offset-1 ring-offset-slate-800' : '';
  return (
    <div ref={setNodeRef} data-slot-id={`slot-${i}`} className={`bg-slate-800 p-3 rounded h-28 flex flex-col items-center justify-center ${ring}`}>
      {s && s.id ? (
        <SortableSlotItem index={i} item={s} patch={patch} />
      ) : (
        <SlotEmpty />
      )}
    </div>
  );
}

export default function ItemSlots({ overId }: { overId?: string | null }){
  const items = useBuildStore(s => s.items);
  const patch = useBuildStore(s => s.patch);
  const remove = useBuildStore(s => s.removeItem);
  const swapItems = useBuildStore(s => s.swapItems);
  // droppable container for any-catalog drops
  const { setNodeRef: setContainerRef, isOver: isContainerOver } = useDroppable({ id: 'items-container' });
  const [highlight, setHighlight] = React.useState<boolean[]>(Array.from({ length: 6 }).map(()=>false));

  React.useEffect(()=>{
    function onItemSet(e: any){
      try{
        const d = e.detail || {};
        const idx = Number(d.slotIndex);
        if (!Number.isNaN(idx) && idx >=0 && idx < 6){
          setHighlight(h => { const next = [...h]; next[idx] = true; return next; });
          setTimeout(()=> setHighlight(h => { const next = [...h]; next[idx] = false; return next; }), 800);
        }
      } catch(err){ console.warn('onItemSet failed', err); }
    }
    window.addEventListener('lolbuilder:item:set', onItemSet as EventListener);
    return ()=> {
      window.removeEventListener('lolbuilder:item:set', onItemSet as EventListener);
    };
  }, []);

  // Provide a stable list of sortable ids for all slots to avoid dnd-kit measurement reflows.
  // Use fixed length (6) to avoid recreating on every render due to item identity changes
  const sortableIds = React.useMemo(()=> Array.from({ length: 6 }).map((_,i)=>`slot-item-${i}`), []);

  // compute per-slot isOver based on global overId passed from MainApp
  return (
    <div>
      <div ref={setContainerRef} className={`p-1 rounded ${overId === 'items-container' || isContainerOver ? 'ring-2 ring-green-400' : ''}`}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3">
            {items.map((s, i) => (
              <Slot key={i} s={s} i={i} patch={patch || 'latest'} highlight={highlight[i]} isOverGlobal={overId === `slot-${i}`} />
            ))}
          </div>
        </SortableContext>
      </div>
      <div className="mt-3 flex items-center gap-2 justify-end">
        <button className="px-3 py-1 rounded bg-orange-700 text-sm" onClick={()=>{ useBuildStore.getState().clearAllItems(); }}>Clear All Items</button>
      </div>
    </div>
  );
}
