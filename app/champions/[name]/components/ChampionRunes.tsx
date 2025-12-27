import React from 'react';
import Image from 'next/image';
import { getRuneIconUrl } from '@/utils/ddragon';

interface ChampionRunesProps {
    championName: string;
    role: string;
    runePages: any[];
    allRunes: any[];
    runeMap: Record<number, string>;
}

const getShardIcon = (id: number) => {
    const map: Record<number, string> = {
        5001: 'StatModsHealthPlusIcon.png',
        5002: 'StatModsArmorIcon.png',
        5003: 'StatModsMagicResIcon.png',
        5005: 'StatModsAttackSpeedIcon.png',
        5008: 'StatModsAdaptiveForceIcon.png',
        5007: 'StatModsCDRScalingIcon.png',
        5010: 'StatModsMovementSpeedIcon.png',
        5011: 'StatModsTenacityIcon.png',
        5013: 'StatModsHealthScalingIcon.png'
    };
    return map[id] ? getRuneIconUrl(`perk-images/StatMods/${map[id]}`) : '';
};

interface RuneTreeProps {
    tree: any;
    page: any;
    isPrimary: boolean;
    getRuneIcon: (id: number) => string;
}

const RuneTree = ({ tree, page, isPrimary, getRuneIcon }: RuneTreeProps) => {
    if (!tree) return null;
    const slots = isPrimary ? tree.slots : tree.slots.slice(1);
    const activeColor = isPrimary ? 'border-lol-gold shadow-[0_0_15px_rgba(200,155,60,0.5)]' : 'border-lol-blue shadow-[0_0_15px_rgba(0,200,255,0.5)]';

    return (
        <div className="bg-[#161616] rounded-xl p-8 border border-white/5">
            <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
                <Image src={getRuneIcon(isPrimary ? page.primaryStyle : page.subStyle)} alt={isPrimary ? "Primary Style" : "Sub Style"} width={40} height={40} className="w-10 h-10" />
                <span className="text-2xl font-bold text-white">{tree.name || (isPrimary ? 'Primary' : 'Secondary')}</span>
            </div>

            <div className={`space-y-8 ${!isPrimary ? 'mb-10' : ''}`}>
                {slots.map((slot: any, sIdx: number) => (
                    <RuneRow key={sIdx} slot={slot} page={page} isPrimary={isPrimary} activeColor={activeColor} />
                ))}
            </div>
            {!isPrimary && <ShardSection page={page} />}
        </div>
    );
};

const RuneRow = ({ slot, page, isPrimary, activeColor }: any) => {
    const getRuneIconClass = (active: boolean) => {
        const sizeClass = isPrimary ? 'w-14 h-14' : 'w-12 h-12';
        const stateClass = active ? `${activeColor} opacity-100 scale-110` : 'border-transparent opacity-30 grayscale hover:opacity-60';
        return `${sizeClass} rounded-full border-2 transition-all ${stateClass}`;
    };

    return (
        <div className="flex justify-between items-center px-4">
            {slot.runes.map((rune: any) => {
                const active = page.perks.includes(rune.id);
                return (
                    <div key={rune.id} className="relative group">
                        <Image
                            src={getRuneIconUrl(rune.icon)}
                            alt={`Rune ${rune.id}`}
                            width={isPrimary ? 56 : 48}
                            height={isPrimary ? 56 : 48}
                            className={getRuneIconClass(active)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

const ShardSection = ({ page }: { page: any }) => (
    <div className="pt-8 border-t border-white/5">
        <div className="space-y-4">
            {[
                [5008, 5005, 5007], // Offense
                [5008, 5010, 5001], // Flex
                [5001, 5011, 5013]  // Defense
            ].map((rowIds, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-8">
                    {rowIds.map((shardId) => {
                        let active = false;
                        if (page.perks.length >= 9) {
                            const shardIndex = page.perks.length - 3 + rowIdx;
                            active = page.perks[shardIndex] === shardId;
                        } else {
                            active = page.perks.includes(shardId) || (page.statPerks && Object.values(page.statPerks).includes(shardId));
                        }

                        const iconUrl = getShardIcon(shardId);
                        const activeClass = 'border-white opacity-100 scale-110 bg-[#333]';
                        const inactiveClass = 'border-transparent opacity-20 grayscale bg-[#222]';

                        return (
                            <div key={shardId} className={`relative w-12 h-12 rounded-full border-2 transition-all ${active ? activeClass : inactiveClass}`}>
                                {iconUrl && <Image src={iconUrl} alt={`Shard ${shardId}`} width={48} height={48} className="w-full h-full p-1" />}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </div>
);

export const ChampionRunes: React.FC<ChampionRunesProps> = ({ championName, role, runePages, allRunes, runeMap }) => {
    const getRuneIcon = (id: number) => {
        if (!runeMap[id]) return getRuneIconUrl('rune/8000.png'); // Fallback
        return getRuneIconUrl(runeMap[id]);
    };

    if (!runePages || runePages.length === 0) {
        return (
            <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between bg-[#1a1a1a] px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white">Recommended</h3>
                    </div>
                </div>
                <div className="text-gray-500 text-sm p-6">No rune data available.</div>
            </div>
        );
    }

    const page = runePages[0];
    const primaryTree = allRunes.find((t: any) => t.id === page.primaryStyle);
    const subTree = allRunes.find((t: any) => t.id === page.subStyle);

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
            {/* Header Tab */}
            <div className="flex items-center justify-between bg-[#1a1a1a] px-6 py-3 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Recommended</h3>
                    <div className="flex gap-1">
                        <Image src={getRuneIcon(page.primaryStyle)} alt="Primary Style" width={20} height={20} className="w-5 h-5" />
                        <Image src={getRuneIcon(page.subStyle)} alt="Sub Style" width={20} height={20} className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Header Info */}
                <div className="flex justify-between items-center mb-6 border-l-4 border-lol-blue pl-4">
                    <div>
                        <h4 className="text-xl font-bold text-white">{championName} Runes</h4>
                        <div className="text-sm text-gray-500">{role} Build</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-white">{page.winRate.toFixed(2)}% WR</div>
                        <div className="text-sm text-gray-500">{page.matches.toLocaleString()} Matches</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RuneTree tree={primaryTree} page={page} isPrimary={true} getRuneIcon={getRuneIcon} />
                    <RuneTree tree={subTree} page={page} isPrimary={false} getRuneIcon={getRuneIcon} />
                </div>
            </div>
        </div>
    );
};
