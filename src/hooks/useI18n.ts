'use client';
import { useEffect, useState } from 'react';
import useBuildStore from '@/stores/useBuildStore';

const cache: Record<string, Record<string,string>> = {};

export default function useI18n(){
  const locale = useBuildStore(s => s.locale || 'en_US');
  const [dict, setDict] = useState<Record<string,string>>({});

  useEffect(()=>{
    let mounted = true;
    async function load(){
      const key = locale === 'fr' || locale.startsWith('fr') ? 'fr' : 'en';
      if (cache[key]) { setDict(cache[key]); return; }
      try{
        const res = await fetch(`/i18n/${key}.json`);
        if (!res.ok) throw new Error('no i18n');
        const json = await res.json();
        cache[key] = json;
        if (mounted) setDict(json);
      } catch (err){ if (mounted) setDict({}); }
    }
    load();
    return ()=>{ mounted=false };
  }, [locale]);

  function t(k: string){ return dict[k] || k; }
  return { t, dict, locale };
}
