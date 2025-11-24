'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { itemIconUrl } from '@/lib/dd/imageUrl';

export default function DraggableItem({ item, patch, onHover, onLeave }: { item: any; patch: string; onHover?: (it:any, x:number,y:number)=>void; onLeave?: ()=>void }){
  const id = `catalog-item-${item.id}`;
  const imageName = item.imageFull || (item.image && (typeof item.image === 'string' ? item.image : item.image.full)) || `${item.id}.png`;
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({ id, data: { current: { source: 'catalog', item, patch } } });

  return (
    <div className="min-w-0">
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        data-draggable={id}
        data-item-name={item.name}
        data-item-image={imageName}
        className={`bg-slate-800 p-3 rounded flex flex-col items-center min-w-0 w-full ${isDragging ? 'opacity-40' : 'opacity-100'}`}
        onMouseEnter={(e)=>{ if (onHover){ const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); onHover(item, rect.left + rect.width / 2, rect.top + rect.height / 2); } }}
        onMouseLeave={()=>{ if (onLeave) onLeave(); }}
      >
        <div className="w-10 h-10">
          <img draggable={false} alt={item.name} src={itemIconUrl(patch || 'latest', imageName)} onError={(e:any)=>{ e.currentTarget.onerror=null; e.currentTarget.src = itemIconUrl('latest', imageName || `${item.id}.png`) }} className="w-10 h-10 object-contain" />
        </div>
        <div className="text-[13px] mt-1 text-center truncate w-full">{item.name}</div>
      </div>
    </div>
  );
}
