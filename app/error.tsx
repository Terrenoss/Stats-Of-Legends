
"use client";

import { useEffect } from "react";
import { RotateCcw, ShieldAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4">
      <div className="w-20 h-20 bg-lol-loss/20 border border-lol-loss rounded-full flex items-center justify-center mb-6 animate-pulse">
         <ShieldAlert className="w-10 h-10 text-lol-loss" />
      </div>
      
      <h2 className="text-3xl font-display font-bold text-white mb-3">Erreur Critique</h2>
      <p className="text-gray-400 max-w-md mb-8">
        Une anomalie a été détectée dans le système. Nos techno-mages sont sur le coup.
        <br/>
        <span className="text-xs text-gray-600 font-mono mt-2 block">{error.message || "Unknown Error"}</span>
      </p>
      
      <button
        onClick={() => reset()}
        className="px-6 py-3 border border-lol-gold text-lol-gold hover:bg-lol-gold hover:text-black font-bold rounded-full transition-all flex items-center gap-2 uppercase tracking-wide text-sm"
      >
        <RotateCcw className="w-4 h-4" /> Réessayer
      </button>
    </div>
  );
}
