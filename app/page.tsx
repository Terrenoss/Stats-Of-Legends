"use client";

import { SearchHero } from "../components/SearchHero";
import { useI18n } from "./LanguageContext";
import { SafeLink } from "../components/ui/SafeLink";

export default function Home() {
  const { t } = useI18n();

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

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <div className={`h-full p-6 rounded-[2rem] bg-[#121212] border border-white/5 hover:border-${color === 'gold' ? 'lol-gold' : color + '-500'}/50 transition group cursor-pointer relative overflow-hidden`}>
    <div className={`absolute top-0 left-0 w-full h-1 bg-${color === 'gold' ? 'lol-gold' : color === 'red' ? 'lol-red' : 'lol-hextech'}`}></div>
    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);
