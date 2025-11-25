import React, { useState } from 'react';
import { BarChart2, Hammer, Trophy, Globe, Info, ChevronDown, Gamepad2 } from 'lucide-react';
import { CURRENT_PATCH_FALLBACK, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
  currentLang: Language;
  onSetLang: (lang: Language) => void;
  currentPatch?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, currentLang, onSetLang, currentPatch }) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLang];

  const patchLabel = currentPatch || CURRENT_PATCH_FALLBACK;

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 cursor-pointer flex items-center gap-3 group" 
              onClick={() => onNavigate?.('home')}
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 bg-lol-gold/20 rounded-full group-hover:bg-lol-red/20 blur-md transition-colors duration-500"></div>
                <div className="relative z-10 w-full h-full bg-[#121212] border border-lol-gold/30 rounded-2xl flex items-center justify-center group-hover:border-lol-red/50 transition-colors duration-300 shadow-glow-gold group-hover:shadow-glow-red">
                  <Gamepad2 className="text-lol-gold w-6 h-6 group-hover:text-lol-red transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-gray-100 font-display uppercase leading-none">
                  Stats Of
                </span>
                <span className="font-bold text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lol-gold to-lol-red font-display uppercase leading-none drop-shadow-sm">
                  Legends
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-12 flex items-baseline space-x-2">
                <NavButton 
                  label={t.home} 
                  active={currentView === 'home'} 
                  onClick={() => onNavigate?.('home')} 
                />
                <NavButton 
                  label={t.builder} 
                  icon={<Hammer className="w-4 h-4" />}
                  active={currentView === 'builder'} 
                  onClick={() => onNavigate?.('builder')} 
                />
                <NavButton 
                  label={t.leaderboard} 
                  icon={<Trophy className="w-4 h-4" />}
                  active={currentView === 'leaderboard'} 
                  onClick={() => onNavigate?.('leaderboard')} 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Patch Version */}
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Patch</span>
               <div className="flex items-center gap-2 text-lol-gold font-mono text-sm">
                  <span className="w-2 h-2 rounded-full bg-lol-red shadow-[0_0_8px_#C23030] animate-pulse"></span>
                  <a
                    href="https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-25-23-notes/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    aria-label={`Ouvrir les notes du patch ${patchLabel}`}
                  >
                    {patchLabel}
                  </a>
               </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block"></div>

            {/* Language Switcher */}
            <div className="relative">
              <div 
                className="hidden md:flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border border-white/5 hover:border-lol-gold/30 hover:bg-white/5 transition group"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              >
                 <Globe className="w-4 h-4 text-gray-400 group-hover:text-lol-gold transition-colors" />
                 <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{currentLang}</span>
                 <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-32 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn overflow-hidden">
                   {(['FR', 'EN', 'ES', 'KR'] as Language[]).map(lang => (
                     <div 
                       key={lang}
                       className={`px-4 py-2 text-xs font-bold hover:bg-white/5 cursor-pointer flex items-center justify-between group ${currentLang === lang ? 'text-lol-gold' : 'text-gray-400'}`}
                       onClick={() => { onSetLang(lang); setIsLangMenuOpen(false); }}
                     >
                       {lang}
                       {currentLang === lang && <div className="w-1.5 h-1.5 rounded-full bg-lol-gold shadow-glow-gold"></div>}
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ label, icon, active, onClick }: { label: string, icon?: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      relative px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-full group
      ${active 
        ? 'text-[#050505] bg-lol-gold shadow-[0_0_15px_rgba(200,170,110,0.3)]' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    <div className="flex items-center gap-2 relative z-10">
      {icon} {label}
    </div>
  </button>
);