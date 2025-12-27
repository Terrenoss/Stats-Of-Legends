import React from 'react';
import Image from 'next/image';
import { Match } from '../../../types';
import { ArrowRight } from 'lucide-react';

interface MatchBuildProps {
    match: Match;
}

export const MatchBuild: React.FC<MatchBuildProps> = ({ match }) => {
    const itemBuild = match.itemBuild || [];
    const runes = match.me?.runes;

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
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5 overflow-x-auto">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Item Build Path</h4>
                <div className="flex items-center min-w-max pb-4">
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
                                    <ArrowRight className="w-4 h-4 text-gray-600 mx-4" />
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-gray-500 text-sm">No item path data available.</div>
                    )}
                </div>
            </div>

            {/* Runes (Basic View) */}
            <div className="bg-[#121212] p-6 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Runes</h4>
                <div className="flex items-center gap-6">
                    <RuneDisplay rune={(runes && runes.primary) ? runes.primary : undefined} type="KEYSTONE" />
                    <RuneDisplay rune={runes?.secondary} type="SECONDARY" />
                </div>
            </div>
        </div>
    );
};

const RuneDisplay = ({ rune, type }: { rune?: string, type: 'KEYSTONE' | 'SECONDARY' }) => {
    if (!rune) return null;
    const isKeystone = type === 'KEYSTONE';
    const label = isKeystone ? 'Keystone' : 'Secondary';
    return (
        <div className="flex flex-col items-center gap-2">
            <Image
                src={rune}
                width={isKeystone ? 64 : 48}
                height={isKeystone ? 64 : 48}
                className={`rounded-full bg-black ${isKeystone ? 'w-16 h-16 border border-lol-gold/50' : 'w-12 h-12 border border-gray-600 p-2'}`}
                alt={label}
            />
            <span className={`text-xs font-bold ${isKeystone ? 'text-lol-gold' : 'text-gray-400'}`}>
                {label}
            </span>
        </div>
    );
};
