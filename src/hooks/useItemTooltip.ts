import { useState, useEffect, useRef, useCallback } from 'react';

export default function useItemTooltip(){
  const [visible, setVisible] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [pos, setPos] = useState<{x:number,y:number}>({ x:0, y:0 });
  const lastShowRef = useRef<number>(0);

  const hide = useCallback(()=>{ setVisible(false); setItem(null); }, []);
  const show = useCallback((it:any, x:number, y:number)=>{ setItem(it); setPos({ x,y }); setVisible(true); lastShowRef.current = Date.now(); }, []);

  useEffect(()=>{
    function onScroll(){ if (visible) hide(); }
    function onBlur(){ if (visible) hide(); }
    function onDragStart(){ if (visible) hide(); }
    function onPointerDown(e: PointerEvent){ if (!visible) return; /* always hide on any pointerdown outside */ hide(); }
    function onHideEvent(){ if (visible) hide(); }

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('lolbuilder:tooltip:hide', onHideEvent as EventListener);
    return ()=>{ window.removeEventListener('scroll', onScroll, true); window.removeEventListener('blur', onBlur); window.removeEventListener('dragstart', onDragStart); window.removeEventListener('pointerdown', onPointerDown, true); };
  }, [visible, hide]);

  return { visible, item, pos, show, hide };
}
