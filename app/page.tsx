"use client";

import { SearchHero } from "../components/SearchHero";
import { useLanguage } from "./LanguageContext";
import { TRANSLATIONS } from "../constants";
import { SafeLink } from "../components/ui/SafeLink";

export default function Home() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  return (
    <div className="animate-fadeIn">
      {/* SearchHero now reads language from context */}
      <SearchHero />

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <FeatureCard icon="⚡" title={t.realTime} desc={t.realTimeDesc} color="purple" />
          <FeatureCard icon="🤖" title={t.aiCoach} desc={t.aiCoachDesc} color="gold" />
          <SafeLink href="/builder" className="block h-full">
            <FeatureCard icon="⚔️" title="Builder Noxus" desc={t.builderDesc} color="red" />
          </SafeLink>
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc, color }: any) => {
  const getBgColor = (c: string) => {
    if (c === 'gold') return 'lol-gold';
    if (c === 'red') return 'lol-red';
    return 'lol-hextech';
  };

  const getBorderColor = (c: string) => {
    if (c === 'gold') return 'lol-gold';
    return `${c}-500`;
  };

  return (
    <div className={`h-full p-6 rounded-[2rem] bg-[#121212] border border-white/5 hover:border-${getBorderColor(color)}/50 transition group cursor-pointer relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-${getBgColor(color)}`}></div>
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
};
