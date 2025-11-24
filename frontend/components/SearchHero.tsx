import React, { useState } from 'react';
import { Search, ArrowRight, Crosshair } from 'lucide-react';
import { Region, Language, SeasonInfo } from '../types';
import { REGIONS, TRANSLATIONS } from '../constants';

interface SearchHeroProps {
  onSearch: (query: string, region: Region) => void;
  lang: Language;
  seasonInfo?: SeasonInfo;
}

export const SearchHero: React.FC<SearchHeroProps> = ({ onSearch, lang, seasonInfo }) => {
  const [input, setInput] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region>('EUW');
  const [suggestions, setSuggestions] = useState<{ gameName: string; tagLine: string; puuid: string; }[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const t = TRANSLATIONS[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input, selectedRegion);
  };

  const handleChange = async (val: string) => {
    setInput(val);
    setSuggestions([]);

    if (!val.includes('#') || val.length < 3) return;

    setLoadingSuggest(true);
    try {
      const res = await fetch(`/api/riot/search?query=${encodeURIComponent(val)}&region=${encodeURIComponent(selectedRegion)}`);
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      // ignore
    } finally {
      setLoadingSuggest(false);
    }
  };

  const info = seasonInfo;

  return (
    <div className="relative overflow-hidden bg-[#050505] py-24 sm:py-32 border-b border-white/5">
      {/* Abstract Background Shapes - Void Purple & Gold */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lol-hextech/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-lol-gold/5 rounded-full blur-[120px]"></div>
         <div className="absolute inset-0 bg-hex-pattern opacity-5 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-lol-gold/10 border border-lol-gold/20 text-lol-gold text-xs font-bold tracking-widest uppercase shadow-glow-gold">
          {info ? `${info.season} ${info.split}` : 'Season 2024 Split 2'}
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 font-display uppercase drop-shadow-2xl">
          {t.heroTitle} <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lol-gold via-lol-red to-lol-hextech drop-shadow-lg">
            {t.heroHighlight}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400 mb-12 font-light leading-relaxed">
          {t.heroDesc}
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto group">
          {/* Glow effect behind input */}
          <div className="absolute -inset-1 bg-gradient-to-r from-lol-gold/30 via-lol-hextech/30 to-lol-red/30 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition duration-700 pointer-events-none"></div>
          
          {/* Input Container */}
          <div className="relative flex items-center bg-[#121212] border border-white/10 rounded-full p-2 shadow-2xl transition-colors hover:border-lol-gold/30">
            <div className="pl-5 pr-3">
               <Search className="w-6 h-6 text-lol-gold" />
            </div>
            <input
              type="text"
              className="flex-grow bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 px-2 py-4 text-lg font-medium"
              placeholder={t.searchPlaceholder}
              value={input}
              onChange={(e) => handleChange(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-lol-gold hover:bg-white text-black font-bold py-3.5 px-8 rounded-full shadow-[0_0_15px_rgba(200,170,110,0.4)] transition-all flex items-center gap-2 tracking-wide uppercase text-sm hover:scale-105 active:scale-95"
            >
              {t.go} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl text-left z-20">
              {suggestions.map((s) => (
                <button
                  key={s.puuid}
                  type="button"
                  className="w-full px-4 py-2 text-sm text-gray-200 hover:bg-white/5 flex items-center justify-between"
                  onClick={() => {
                    const q = `${s.gameName}#${s.tagLine}`;
                    setInput(q);
                    setSuggestions([]);
                    onSearch(q, selectedRegion);
                  }}
                >
                  <span>{s.gameName}#{s.tagLine}</span>
                </button>
              ))}
            </div>
          )}

          {/* Region Buttons - Added relative z-10 to fix clicking issue */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-10">
            {REGIONS.map(region => (
              <button 
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`
                  px-4 py-1.5 text-xs font-bold rounded-full border transition-all duration-300 uppercase tracking-wider
                  ${selectedRegion === region 
                    ? 'bg-lol-gold text-black border-lol-gold shadow-glow-gold scale-105' 
                    : 'bg-[#121212] border-white/10 text-gray-500 hover:border-gray-500 hover:text-gray-300'}
                `}
              >
                {region}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};