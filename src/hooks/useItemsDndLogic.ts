'use client';
import { useRef, useEffect } from 'react';

export default function useItemsDndLogic(){
  const supportsDndKitRef = useRef(false);
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        // attempt to detect dnd-kit dynamic import
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const core = await import('@dnd-kit/core');
        if (mounted && core) supportsDndKitRef.current = true;
      } catch (err){ supportsDndKitRef.current = false; }
    })();
    return ()=>{ mounted=false };
  },[]);

  const noop = () => {};
  const onDragOverAllow = (e: React.DragEvent) => { e.preventDefault(); };

  return {
    supportsDndKit: supportsDndKitRef,
    onNativeItemDragStart: noop,
    onNativeSlotDragStart: noop,
    onNativeDropOnSlot: noop,
    onNativeDropOnTrash: noop,
    onDragOverAllow
  } as const;
}
