
"use client";

import { SafeLink } from "@/components/ui/SafeLink";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4 animate-fadeIn relative overflow-hidden">
        <div className="absolute inset-0 bg-hex-pattern opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-lol-hextech/10 rounded-full blur-[150px]"></div>
        
        <div className="w-24 h-24 bg-lol-dark border border-lol-gold rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(212,175,55,0.2)] relative z-10">
            <AlertTriangle className="w-12 h-12 text-lol-gold" />
        </div>
        
        <h1 className="text-6xl font-display font-black text-white mb-4 relative z-10">404</h1>
        <h2 className="text-2xl font-bold text-gray-300 mb-6 uppercase tracking-widest relative z-10">Lost in the Void</h2>
        
        <p className="text-gray-500 max-w-md mb-10 leading-relaxed relative z-10">
            La page que vous recherchez semble avoir été engloutie par le Néant. 
            Vérifiez l'URL ou retournez en lieu sûr.
        </p>
        
        <SafeLink 
            href="/"
            className="px-8 py-3 bg-lol-gold hover:bg-white text-black font-bold rounded-full transition-all flex items-center gap-2 uppercase tracking-wide text-sm shadow-glow-gold hover:scale-105 active:scale-95 relative z-10"
        >
            <Home className="w-4 h-4" /> Retour à l'accueil
        </SafeLink>
    </div>
  );
}
