'use client';

import { SearchHero } from '../components/SearchHero';
import { useLanguage } from './LanguageContext';
import { TRANSLATIONS } from '../constants';
import { SafeLink } from '../components/ui/SafeLink';

const CARD_BG_COLOR = '#121212';

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

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: 'gold' | 'red' | 'purple';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color }) => {
  const colorClasses = {
    gold: { border: 'hover:border-lol-gold/50', bar: 'bg-lol-gold' },
    red: { border: 'hover:border-red-500/50', bar: 'bg-lol-red' },
    purple: { border: 'hover:border-purple-500/50', bar: 'bg-lol-hextech' }
  };

  const classes = colorClasses[color];

  return (
    <div className={`h-full p-6 rounded-[2rem] bg-[${CARD_BG_COLOR}] border border-white/5 ${classes.border} transition group cursor-pointer relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${classes.bar}`}></div>
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
};
