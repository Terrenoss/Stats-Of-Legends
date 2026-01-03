import React from 'react';
import Image from 'next/image';
import { Match } from '../../../types';
import { ArrowRight } from 'lucide-react';
import { getRuneIconUrl } from '../../../utils/ddragon';

interface MatchBuildProps {
    match: Match;
}

export const MatchBuild: React.FC<MatchBuildProps> = ({ match }) => {
    const itemBuild = match.itemBuild || [];
    const runes = match.me?.runes;

    const RUNE_STYLE_NAMES: Record<number, string> = {
        8000: 'PRECISION',
        8100: 'DOMINATION',
        8200: 'SORCERY',
        8300: 'INSPIRATION',
        8400: 'RESOLVE'
    };

    const RUNE_STYLE_ICONS: Record<number, string> = {
        8000: 'perk-images/Styles/7201_Precision.png',
        8100: 'perk-images/Styles/7200_Domination.png',
        8200: 'perk-images/Styles/7202_Sorcery.png',
        8300: 'perk-images/Styles/7203_Whimsy.png',
        8400: 'perk-images/Styles/7204_Resolve.png'
    };

    // Sort by timestamp
    const getSec = (s: string) => {
        const m = (s && s.match) ? s.match(/(\d+)m\s*(\d+)?s?/) : null;
        return m ? parseInt(m[1]) * 60 + parseInt(m[2] || '0') : 0;
    };

    const sortedBuild = [...itemBuild].sort((a, b) => {
        return getSec(a.timestamp) - getSec(b.timestamp);
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Item Path */}
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Item Build Path</h4>
                <div className="flex flex-wrap gap-y-8 gap-x-2 pb-4">
                    {sortedBuild.length > 0 ? sortedBuild.map((step, idx) => {
                        const isSold = step.action === 'ITEM_SOLD';
                        const imgClass = isSold
                            ? 'border-red-500/50 opacity-60 grayscale'
                            : 'border-gray-700 group-hover:border-lol-gold';

                        return (
                            <div key={idx} className="flex items-center">
                                <div className="flex flex-col items-center gap-2 group">
                                    <div className="relative">
                                        <Image
                                            src={step.item.imageUrl}
                                            width={40}
                                            height={40}
                                            className={`w-10 h-10 rounded-lg border transition-colors ${imgClass}`}
                                            title={`${step.item.name} (${step.action})`}
                                            alt={step.item.name || 'Item'}
                                        />
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-[9px] px-1.5 rounded border border-white/10 whitespace-nowrap">{step.timestamp}</div>
                                        {step.action === 'ITEM_SOLD' && (
                                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] px-1 rounded-bl font-bold">SOLD</div>
                                        )}
                                    </div>
                                </div>
                                {idx < sortedBuild.length - 1 && (
                                    <ArrowRight className="w-4 h-4 text-gray-600 mx-2" />
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-gray-500 text-sm">No item path data available.</div>
                    )}
                </div>
            </div>

            {/* Runes (Detailed View) */}
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Runes</h4>
                <div className="flex flex-row gap-24 justify-center items-start">
                    {/* Left Column: Primary Tree */}
                    <div className="flex flex-col gap-4 items-center">
                        <h5 className="text-[10px] font-bold text-lol-gold uppercase tracking-wider mb-1">Primary</h5>

                        {/* Keystone */}
                        {runes?.primarySelections && runes.primarySelections[0] && (
                            <div className="mb-2">
                                <Image
                                    src={runes.primarySelections[0].icon}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full bg-black border border-lol-gold/50"
                                    alt="Keystone"
                                    title={runes.primarySelections[0].name}
                                />
                            </div>
                        )}

                        {/* Primary Slots */}
                        <div className="flex flex-col gap-3">
                            {runes?.primarySelections?.slice(1).map((rune, idx) => (
                                <div key={idx} className="flex justify-center">
                                    <Image
                                        src={rune.icon}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full bg-black border border-gray-700 grayscale hover:grayscale-0 transition-all"
                                        alt={rune.name || 'Rune'}
                                        title={rune.name}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Secondary + Stats */}
                    <div className="flex flex-col gap-8">
                        {/* Secondary Tree */}
                        <div className="flex flex-col gap-4 items-center">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {runes?.subStyleId && RUNE_STYLE_NAMES[runes.subStyleId] ? RUNE_STYLE_NAMES[runes.subStyleId] : 'SECONDARY'}
                            </h5>

                            {/* Secondary Style Icon */}
                            {runes?.subStyleId && RUNE_STYLE_ICONS[runes.subStyleId] && (
                                <div className="mb-2">
                                    <Image
                                        src={getRuneIconUrl(RUNE_STYLE_ICONS[runes.subStyleId])}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full bg-black border border-gray-700 grayscale hover:grayscale-0 transition-all"
                                        alt="Secondary Style"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-3 mt-4">
                                {runes?.subSelections?.map((rune, idx) => (
                                    <div key={idx} className="flex justify-center">
                                        <Image
                                            src={rune.icon}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full bg-black border border-gray-700 grayscale hover:grayscale-0 transition-all"
                                            alt={rune.name || 'Rune'}
                                            title={rune.name}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stat Perks */}
                        <div className="flex flex-col gap-4 items-center">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Stats</h5>
                            <div className="flex flex-col gap-3">
                                {[runes?.statPerks?.offense, runes?.statPerks?.flex, runes?.statPerks?.defense].map((perk, idx) => (
                                    perk && (
                                        <div key={idx} className="flex justify-center">
                                            <Image
                                                src={perk.icon}
                                                width={24}
                                                height={24}
                                                className="w-6 h-6 rounded-full bg-black border border-gray-800"
                                                alt="Stat Perk"
                                            />
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
