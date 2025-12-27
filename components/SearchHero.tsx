"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, History, X } from 'lucide-react';
import { Region, SeasonInfo, Language } from '../types';
import { REGIONS, CURRENT_SEASON_INFO, TRANSLATIONS } from '../constants';
import { useSafeNavigation } from '../hooks/useSafeNavigation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from "../app/LanguageContext";
import { RegionButton } from './search/RegionButton';

interface SearchHeroProps {
  onSearch?: (query: string, region: Region) => void;
  seasonInfo?: SeasonInfo;
  lang?: Language;
}

interface RecentSearch {
  name: string;
  tag: string;
  region: Region;
  timestamp: number;
}



export const SearchHero: React.FC<SearchHeroProps> = ({ onSearch, seasonInfo, lang }) => {
  const [input, setInput] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region>('EUW');
  const [suggestions, setSuggestions] = useState<{ gameName: string; tagLine: string; puuid: string; }[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [recentSearches, setRecentSearches, isStorageReady] = useLocalStorage<RecentSearch[]>('recent_searches_v1', []);

  const { push } = useSafeNavigation();
  const { lang: ctxLang } = useLanguage();
  const t = lang ? TRANSLATIONS[lang] : TRANSLATIONS[ctxLang];

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLFormElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const addToRecent = (gameName: string, tagLine: string, region: Region) => {
    setRecentSearches(prev => {
      // Remove duplicates
      const filtered = prev.filter(item =>
        !(item.name.toLowerCase() === gameName.toLowerCase() &&
          item.tag.toLowerCase() === tagLine.toLowerCase() &&
          item.region === region)
      );
      // Add to top, limit to 5
      return [{ name: gameName, tag: tagLine, region, timestamp: Date.now() }, ...filtered].slice(0, 5);
    });
  };

  const removeRecent = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim()) {
      let name = input;
      let tag = selectedRegion as string;

      if (input.includes('#')) {
        [name, tag] = input.split('#');
      } else if (input.includes('-')) {
        [name, tag] = input.split('-');
      }

      // Save to recent
      addToRecent(name, tag, selectedRegion);

      let fullQuery = input;
      if (!fullQuery.includes('#')) {
        fullQuery = `${fullQuery}-${selectedRegion}`;
      } else {
        fullQuery = fullQuery.replace('#', '-');
      }

      if (onSearch) {
        onSearch(fullQuery, selectedRegion);
      } else {
        push(`/summoner/${selectedRegion}/${encodeURIComponent(fullQuery)}`);
      }
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const DEBOUNCE_DELAY = 500;

  useEffect(() => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const apiResponse = await fetch(`/api/riot/search?query=${encodeURIComponent(input)}&region=${encodeURIComponent(selectedRegion)}`);
        if (apiResponse.ok) {
          const searchData = await apiResponse.json();
          setSuggestions(searchData.suggestions || []);
        }
      } catch (err) {
        console.error("Search suggestion error", err);
      } finally {
        setLoadingSuggest(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [input, selectedRegion]);

  const handleSuggestionClick = (s: { gameName: string; tagLine: string }) => {
    addToRecent(s.gameName, s.tagLine, selectedRegion);

    const query = `${s.gameName}#${s.tagLine}`;
    setInput(query);
    setSuggestions([]);

    const fullQuery = `${s.gameName}-${s.tagLine}`;
    if (onSearch) {
      onSearch(fullQuery, selectedRegion);
    } else {
      push(`/summoner/${selectedRegion}/${encodeURIComponent(fullQuery)}`);
    }
  };

  const handleRecentClick = (r: RecentSearch) => {
    const fullQuery = `${r.name}-${r.tag}`;
    setInput(`${r.name}#${r.tag}`);
    setSelectedRegion(r.region);

    // Move to top of list
    addToRecent(r.name, r.tag, r.region);

    if (onSearch) {
      onSearch(fullQuery, r.region);
    } else {
      push(`/summoner/${r.region}/${encodeURIComponent(fullQuery)}`);
    }
    setIsFocused(false);
  };

  const info = seasonInfo ? seasonInfo : CURRENT_SEASON_INFO;

  return (
    <div className="relative overflow-hidden bg-[#050505] py-24 sm:py-32 border-b border-white/5">
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lol-hextech/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-lol-gold/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-hex-pattern opacity-5 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-lol-gold/10 border border-lol-gold/20 text-lol-gold text-xs font-bold tracking-widest uppercase shadow-glow-gold">
          {info ? `${info.season} ${info.split}` : 'Season 2025 Split 2'}
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 font-display uppercase drop-shadow-2xl">
          {t.heroTitle} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lol-gold via-lol-red to-lol-hextech drop-shadow-lg">
            {t.heroHighlight}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 mb-12 font-light leading-relaxed">
          {t.heroDesc}
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group" ref={wrapperRef}>
          <div className="absolute -inset-1 bg-gradient-to-r from-lol-gold/30 via-lol-hextech/30 to-lol-red/30 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-700 pointer-events-none"></div>

          <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-full p-2 shadow-2xl transition-colors hover:border-lol-gold/30 z-30">
            <div className="pl-5 pr-3">
              <Search className="w-6 h-6 text-lol-gold" />
            </div>
            <input
              type="text"
              className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 px-2 py-4 text-lg font-medium outline-none"
              placeholder={t.searchPlaceholder}
              value={input}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
            />
            <button
              type="submit"
              className="bg-lol-gold hover:bg-white text-black font-bold py-3.5 px-8 rounded-full shadow-[0_0_15px_rgba(200,170,110,0.4)] transition-all flex items-center gap-2 tracking-wide uppercase text-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              {loadingSuggest ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" /> : <>{t.go} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          {/* Suggestions & Recent Searches Dropdown */}
          {isFocused && (suggestions.length > 0 || (isStorageReady && recentSearches.length > 0)) && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl text-left z-20 overflow-hidden animate-fadeIn">

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Suggestions</div>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg flex items-center gap-3 transition-colors group/item"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      <div className="w-8 h-8 rounded-full bg-lol-hextech/20 flex items-center justify-center text-lol-hextech group-hover/item:bg-lol-hextech/30 transition-colors">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{s.gameName}</div>
                        <div className="text-gray-500 text-xs">#{s.tagLine}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {isStorageReady && recentSearches.length > 0 && (
                <div className="p-2 border-t border-white/5">
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                    <span>Recent</span>
                    <History className="w-3 h-3" />
                  </div>
                  {recentSearches.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg flex items-center justify-between group/item transition-colors"
                      onClick={() => handleRecentClick(r)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-lol-gold/10 flex items-center justify-center text-lol-gold group-hover/item:bg-lol-gold/20 transition-colors">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{r.name}</div>
                          <div className="text-gray-500 text-xs">#{r.tag} • {r.region}</div>
                        </div>
                      </div>
                      <div
                        className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white opacity-0 group-hover/item:opacity-100 transition-all"
                        onClick={(e) => removeRecent(e, i)}
                      >
                        <X className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Region Selector */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {REGIONS.map((r) => (
            <RegionButton key={r} region={r} selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
          ))}
        </div>
      </div>
    </div>
  );
};


