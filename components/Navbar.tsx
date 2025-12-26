"use client";

import React, { useState, useEffect } from 'react';
import { Hammer, Trophy, Globe, ChevronDown, Gamepad2 } from 'lucide-react';
import { CURRENT_PATCH, TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { SafeLink } from './ui/SafeLink';
import { useSafeNavigation } from '../hooks/useSafeNavigation';
import { useLanguage } from "../app/LanguageContext";

interface NavbarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentPatch, setCurrentPatch] = useState(CURRENT_PATCH);
  const { pathname } = useSafeNavigation();
  const { lang: currentLang, setLang: setCurrentLang } = useLanguage();

  const t = TRANSLATIONS[currentLang];

  useEffect(() => {
    // Use fixed patch version
    setCurrentPatch(CURRENT_PATCH);
  }, []);

  const handleNavClick = (e: React.MouseEvent, view: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(view);
    }
  };

  // Logic to generate patch notes URL
  // Mapping logic: 15.x.y -> patch-25-x-notes (Season 15 -> Year 25)
  const patchParts = currentPatch.split('.');

  let season = patchParts[0];
  if (season === '15') season = '25'; // Map Season 15 to Year 2025 shortcode

  const patchNumber = patchParts[1];

  const patchUrl = patchParts.length >= 2
    ? `https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-${season}-${patchNumber}-notes/`
    : '#';

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <SafeLink href="/" onClick={(e) => handleNavClick(e, 'home')} className="flex-shrink-0 cursor-pointer flex items-center gap-3 group">
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
            </SafeLink>
            <div className="hidden md:block">
              <div className="ml-12 flex items-baseline space-x-2">
                <NavButton
                  label={t.home}
                  active={currentView ? currentView === 'home' : pathname === '/'}
                  href="/"
                  onClick={(e) => handleNavClick(e, 'home')}
                />
                <NavButton
                  label={t.builder}
                  icon={<Hammer className="w-4 h-4" />}
                  active={currentView ? currentView === 'builder' : pathname === '/builder'}
                  href="/builder"
                  onClick={(e) => handleNavClick(e, 'builder')}
                />

                {/* Visual Separator */}
                <div className="h-6 w-px bg-white/10 mx-2"></div>

                <NavButton
                  label={t.leaderboard}
                  icon={<Trophy className="w-4 h-4" />}
                  active={currentView ? currentView === 'leaderboard' : pathname === '/leaderboard'}
                  href="/leaderboard"
                  onClick={(e) => handleNavClick(e, 'leaderboard')}
                />
                <NavButton
                  label={t.tierlist}
                  icon={<Trophy className="w-4 h-4" />}
                  active={currentView ? currentView === 'tierlist' : pathname === '/tierlist'}
                  href="/tierlist"
                  onClick={(e) => handleNavClick(e, 'tierlist')}
                />
              </div>
            </div>
          </div>

          {/* Search Bar - Global (Competitor Style) */}
          <div className="hidden lg:flex items-center mx-4 flex-1 max-w-md xl:max-w-xl 2xl:max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('search') as HTMLInputElement;
                const regionSelect = form.elements.namedItem('region') as HTMLSelectElement;
                if (input.value) {
                  const [name, tag] = input.value.split('#');
                  const region = regionSelect.value || 'EUW';
                  window.location.href = `/summoner/${region}/${name}-${tag || 'EUW'}`;
                }
              }}
              className="relative w-full group flex items-center bg-[#121212] border-2 border-white/10 focus-within:border-lol-gold rounded-lg overflow-hidden transition-all shadow-lg"
            >
              {/* Region Selector */}
              <div className="relative border-r border-white/10 bg-[#1a1a1a] hover:bg-[#252525] transition-colors">
                <select
                  name="region"
                  className="appearance-none bg-transparent text-xs font-bold text-gray-300 py-3 pl-4 pr-8 focus:outline-none cursor-pointer uppercase tracking-wider"
                  defaultValue="EUW"
                >
                  <option value="EUW">EUW</option>
                  <option value="NA1">NA</option>
                  <option value="KR">KR</option>
                  <option value="EUN1">EUNE</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>

              {/* Input */}
              <input
                name="search"
                type="text"
                placeholder="Game Name + #Tag"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 font-medium focus:outline-none"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="bg-lol-gold hover:bg-lol-gold/90 text-black font-bold uppercase tracking-wider text-xs px-6 py-3 transition-colors flex items-center gap-2"
              >
                <span className="hidden xl:inline">Search</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            </form>
          </div>

          <div className="flex items-center gap-6">
            {/* Patch Version */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Patch</span>
              <a
                href={patchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-lol-gold font-mono text-sm hover:text-lol-red transition-colors group cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-lol-red shadow-[0_0_8px_#C23030] animate-pulse group-hover:scale-125 transition-transform"></span>
                <span className="group-hover:underline decoration-lol-red/50 underline-offset-4">{currentPatch}</span>
              </a>
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
                      onClick={() => { setCurrentLang(lang); setIsLangMenuOpen(false); }}
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

interface NavButtonProps {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, active, href, onClick }) => (
  <SafeLink
    href={href}
    onClick={onClick}
    className={`
      relative px-3 lg:px-4 xl:px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-full group flex items-center gap-2 whitespace-nowrap
      ${active
        ? 'text-[#050505] bg-lol-gold shadow-[0_0_15px_rgba(200,170,110,0.3)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'}
    `}
  >
    {icon} <span className="hidden xl:inline">{label}</span>
  </SafeLink>
);
