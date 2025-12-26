import React from 'react';
import { SearchHero } from '../SearchHero';
import { Language, Region } from '../../types';

interface HomeViewProps {
    onSearch: (query: string, region: Region) => void;
    lang: Language;
    t: any;
    onBuilderClick: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSearch, lang, t, onBuilderClick }) => {
    return (
        <div className="animate-fadeIn">
            <SearchHero onSearch={onSearch} lang={lang} />

            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <FeatureCard icon="⚡" title={t.realTime} desc={t.realTimeDesc} color="purple" />
                    <FeatureCard icon="🤖" title={t.aiCoach} desc={t.aiCoachDesc} color="gold" />
                    <FeatureCard icon="⚔️" title="Builder Noxus" desc={t.builderDesc} color="red" onClick={onBuilderClick} />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, color, onClick }: any) => {
    const getColorClass = (c: string) => {
        if (c === 'gold') return 'lol-gold';
        if (c === 'red') return 'lol-red';
        return 'lol-hextech';
    };
    const colorClass = getColorClass(color);

    return (
        <div onClick={onClick} className={`p-6 rounded-[2rem] bg-[#121212] border border-white/5 hover:border-${color === 'gold' ? 'lol-gold' : color + '-500'}/50 transition group cursor-pointer relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-${colorClass}`}></div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
        </div>
    );
};
