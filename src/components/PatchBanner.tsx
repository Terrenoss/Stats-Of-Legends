'use client';

import React, { useEffect, useState } from 'react';
import { buildPatchNotesUrl } from '@/lib/riot/patchNotes';

interface PatchState {
  currentPatch: string | null;
  pending: any | null;
}

export default function PatchBanner() {
  const [state, setState] = useState<PatchState>({ currentPatch: null, pending: null });
  const [notesUrl, setNotesUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/version/current');
      if (!res.ok) return;
      const data = await res.json();
      setState({ currentPatch: data.currentPatch, pending: data.pending || null } as PatchState);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function resolveNotes(){
      if (!state.pending) { setNotesUrl(null); return; }
      // If status success and currentPatch equals pending.version -> hide banner
      if (state.pending.status === 'success' && state.currentPatch === state.pending.version) {
        // hide banner: clear pending by reloading server state
        setNotesUrl(null);
        return;
      }

      setResolving(true);
      try {
        const u = await buildPatchNotesUrl({ version: state.pending.version, locale: 'fr-fr' });
        if (mounted) setNotesUrl(u);
      } catch (err) {
        if (mounted) setNotesUrl(null);
      } finally { if (mounted) setResolving(false); }
    }
    resolveNotes();
    return ()=>{ mounted=false; };
  }, [state.pending, state.currentPatch]);

  if (!state.pending) return null;

  const pending = state.pending;

  // If success and current == pending -> don't show banner
  if (pending.status === 'success' && state.currentPatch === pending.version) return null;

  return (
    <div className="w-full bg-yellow-600 text-black p-3 text-center"> 
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          Nouvelle version disponible: <strong>{pending.version}</strong>
          {pending.status === 'pending' && <span> — En attente</span>}
          {pending.status === 'in_progress' && <span> — Mise à jour en cours…</span>}
          {pending.status === 'failed' && <span> — Échec</span>}
        </div>
        <div className="flex items-center gap-3">
          {resolving ? (
            <button className="bg-slate-800 text-white px-3 py-1 rounded opacity-70" disabled>Résolution…</button>
          ) : notesUrl ? (
            <a className="underline" href={notesUrl} target="_blank" rel="noopener noreferrer">Voir notes</a>
          ) : (
            <a className="underline" href={`https://www.leagueoflegends.com/fr-fr/news/tags/patch-notes`} target="_blank" rel="noopener noreferrer">Voir notes</a>
          )}
          <button onClick={() => fetch(`/api/admin/patches/${pending.version}/apply`, { method: 'POST', headers: { 'x-admin-secret': (window as any).ADMIN_SECRET || '' } })} className="bg-slate-800 text-white px-3 py-1 rounded">Forcer l'application</button>
        </div>
      </div>
    </div>
  );
}
