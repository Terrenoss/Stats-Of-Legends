'use client';

import React, { useEffect, useState } from 'react';
import useBuildStore from '@/stores/useBuildStore';

const LOCALES = [ { code: 'en_US', label: 'EN' }, { code: 'fr_FR', label: 'FR' } ];

export default function LanguageSwitcher(){
  const locale = useBuildStore(s => s.locale);
  const setLocale = useBuildStore(s => s.setLocale);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(()=>{ setMounted(true); const stored = typeof window !== 'undefined' ? localStorage.getItem('locale') : null; if (stored) setLocale(stored); }, [setLocale]);

  function change(l:string){ setLocale(l); setOpen(false); }

  return (
    <div className="relative inline-block">
      <button onClick={()=>setOpen(o=>!o)} className="px-2 py-1 bg-slate-800 rounded">{mounted ? (locale === 'fr_FR' ? '🇫🇷 FR' : '🇬🇧 EN') : 'EN'}</button>
      {open && (
        <div className="absolute right-0 mt-2 bg-slate-900 border border-slate-700 rounded p-2">
          {LOCALES.map(l=> (
            <div key={l.code} className="px-2 py-1 hover:bg-slate-800 rounded cursor-pointer" onClick={()=>change(l.code)}>{l.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

