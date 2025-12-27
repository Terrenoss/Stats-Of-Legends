import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getChampionIconUrl, getSpellIconUrl } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

interface ChampionHeaderProps {
    championName: string;
    role: string;
    rank: string;
    tier: string;
    patch: string;
    topSpells: any[];
    formatTier: (t: string) => string;
    getSpellName: (id: string) => string;
}

const TABS = ['Build', 'Counters', 'Pro Builds'];


const SPELL_ICON_SIZE = 32;

export const ChampionHeader: React.FC<ChampionHeaderProps> = ({
    championName, role, rank, tier, patch, topSpells, formatTier, getSpellName
}) => {
    const router = useRouter();

    return (
        <div className="bg-[#111] border-b border-white/5 pt-8 pb-0">
            <div className="max-w-7xl mx-auto px-8">
                <button
                    onClick={() => router.push('/tierlist?rank=ALL')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-bold"
                >
                    <span>←</span> Back to Tier List
                </button>

                <div className="flex items-start gap-6 mb-8">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-lol-gold shadow-[0_0_20px_rgba(200,155,60,0.3)]">
                        <Image
                            src={getChampionIconUrl(championName, CURRENT_PATCH)}
                            alt={championName}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute top-0 left-0 bg-lol-gold text-black text-xs font-bold px-2 py-0.5 rounded-br-lg">
                            {tier}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-5xl font-display font-bold text-white mb-2 flex items-center gap-4">
                            {championName}
                            <span className="text-2xl font-normal text-gray-400">{role} Build, {formatTier(rank)}</span>
                            <span className="text-xs bg-[#222] text-gray-300 px-2 py-1 rounded border border-white/10">Patch {patch}</span>
                        </h1>
                        <div className="flex gap-2 mt-4">
                            {/* Spell Order Visualization (Placeholder using top spells for now) */}
                            {topSpells.slice(0, 2).map(spell => (
                                <Image
                                    key={spell.id}
                                    src={getSpellIconUrl(getSpellName(spell.id), CURRENT_PATCH)}
                                    alt={`Spell ${spell.id}`}
                                    width={SPELL_ICON_SIZE}
                                    height={SPELL_ICON_SIZE}
                                    className="w-8 h-8 rounded border border-white/20"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-8 text-sm font-bold text-gray-400 border-b border-white/10">
                    {TABS.map((tab, index) => (
                        <button
                            key={tab}
                            className={`pb-4 transition-colors ${index === 0 ? 'border-b-2 border-lol-blue text-white' : 'hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
