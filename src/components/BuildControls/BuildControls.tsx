'use client';
import React, { useState } from 'react';
import useBuildStore from '@/stores/useBuildStore';
import useI18n from '@/hooks/useI18n';

export default function BuildControls(){
  const exportBuild = useBuildStore(s => s.exportBuild);
  const importBuild = useBuildStore(s => s.importBuild);
  const clear = useBuildStore(s => s.clearBuild);
  const clearAllItems = useBuildStore(s => s.clearAllItems);
  const [payload, setPayload] = useState('');
  const { t } = useI18n();

  return (
    <div>
      <div className="flex gap-2">
        <button className="bg-indigo-600 px-3 py-1 rounded" onClick={()=>{ const json = exportBuild(); setPayload(json); navigator.clipboard?.writeText(json); }}>{t('export') || 'Exporter'}</button>
        <button className="bg-red-600 px-3 py-1 rounded" onClick={()=>{ clear(); setPayload(''); }}>{t('clear') || 'Clear'}</button>
        <button className="bg-yellow-600 px-3 py-1 rounded" onClick={()=>{ clearAllItems(); }}>{t('clearAllItems') || 'Clear All Items'}</button>
      </div>
      <div className="mt-2">
        <textarea className="w-full h-24 bg-neutral-800 p-2 rounded" value={payload} onChange={e=>setPayload(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <button className="bg-green-600 px-3 py-1 rounded" onClick={()=>importBuild(payload)}>{t('import') || 'Importer'}</button>
        </div>
      </div>
    </div>
  );
}
