import React from 'react';
import Image from 'next/image';
import { RuneStyle, SelectedRunes, Rune } from '../../types';
import { getRuneIconUrl } from '../../utils/ddragon';

export interface StyleButtonProps {
    style: RuneStyle;
    isSelected: boolean;
    onClick: () => void;
    small?: boolean;
}

export const StyleButton = ({ style, isSelected, onClick, small }: StyleButtonProps) => (
    <button
        onClick={onClick}
        className={`${small ? 'w-10 h-10' : 'w-12 h-12'} flex-shrink-0 aspect-square rounded-full p-2 border-2 transition-all ${isSelected
            ? 'border-lol-gold bg-lol-gold/10 scale-110 shadow-[0_0_15px_rgba(200,155,60,0.3)]'
            : 'border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 grayscale hover:grayscale-0'
            }`}
        title={style.name}
    >
        <Image src={getRuneIconUrl(style.icon)} alt={style.name} width={small ? 40 : 48} height={small ? 40 : 48} className="w-full h-full object-contain" />
    </button>
);

export interface RuneIconProps {
    rune: Rune | { id: number; key: string; icon: string; name: string; shortDesc: string; longDesc: string };
    isSelected: boolean;
    onClick: () => void;
    isKeystone?: boolean;
    size?: number;
}

export const RuneIcon = ({ rune, isSelected, onClick, isKeystone, size = 48 }: RuneIconProps) => (
    <div
        className="relative group cursor-pointer flex-shrink-0 aspect-square flex items-center justify-center"
        onClick={onClick}
        style={{ width: size, height: size }}
    >
        <div className={`w-full h-full rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden ${isSelected
            ? 'border-lol-gold shadow-[0_0_15px_rgba(200,155,60,0.6)] grayscale-0 scale-110 bg-black/50'
            : 'border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110'}`}>
            <Image
                src={getRuneIconUrl(rune.icon)}
                width={size}
                height={size}
                alt={rune.name}
                className="object-contain transition-transform"
                style={{
                    width: '85%',
                    height: '85%'
                }}
            />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1a1a1a] border border-lol-gold/30 p-3 rounded-xl shadow-xl z-50 hidden group-hover:block pointer-events-none">
            <h4 className="text-lol-gold font-bold text-sm mb-1">{rune.name}</h4>
            <p className="text-[10px] text-gray-400 leading-tight">
                {rune.shortDesc.replace(/<[^>]*>?/gm, '')}
            </p>
        </div>
    </div>
);

export interface PrimaryPathProps {
    styles: RuneStyle[];
    selectedRunes: SelectedRunes;
    onStyleChange: (styleId: number) => void;
    onPerkSelect: (index: number, perkId: number) => void;
}

export const PrimaryPath = ({ styles, selectedRunes, onStyleChange, onPerkSelect }: PrimaryPathProps) => {
    const primaryStyle = styles.find((s: any) => s.id === selectedRunes.primaryStyleId);

    return (
        <div className="space-y-6">
            <div className="flex gap-3 mb-6 justify-center flex-wrap">
                {styles.map((style: any) => (
                    <StyleButton
                        key={style.id}
                        style={style}
                        isSelected={selectedRunes.primaryStyleId === style.id}
                        onClick={() => onStyleChange(style.id)}
                    />
                ))}
            </div>

            {primaryStyle && (
                <div className="space-y-6 animate-fadeIn px-2">
                    <div className="flex justify-center gap-4">
                        {primaryStyle.slots[0].runes.map((rune: any) => (
                            <RuneIcon
                                key={rune.id}
                                rune={rune}
                                isSelected={selectedRunes.selectedPerkIds[0] === rune.id}
                                onClick={() => onPerkSelect(0, rune.id)}
                                isKeystone
                                size={60}
                            />
                        ))}
                    </div>
                    {[1, 2, 3].map(slotIdx => (
                        <div key={slotIdx} className={`flex justify-center gap-4 ${slotIdx === 1 ? 'border-t border-white/5 pt-6' : ''}`}>
                            {primaryStyle.slots[slotIdx].runes.map((rune: any) => (
                                <RuneIcon
                                    key={rune.id}
                                    rune={rune}
                                    isSelected={selectedRunes.selectedPerkIds[slotIdx] === rune.id}
                                    onClick={() => onPerkSelect(slotIdx, rune.id)}
                                    size={48}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export interface SecondaryPathProps {
    styles: RuneStyle[];
    selectedRunes: SelectedRunes;
    onStyleChange: (styleId: number) => void;
    onRuneClick: (runeId: number) => void;
}

export const SecondaryPath = ({ styles, selectedRunes, onStyleChange, onRuneClick }: SecondaryPathProps) => {
    const subStyle = styles.find((s: any) => s.id === selectedRunes.subStyleId);

    return (
        <div className="space-y-6 border-l border-white/5 pl-4 relative">
            <div className="flex gap-2 mb-6 justify-center flex-wrap">
                {styles.filter((s: any) => s.id !== selectedRunes.primaryStyleId).map((style: any) => (
                    <StyleButton
                        key={style.id}
                        style={style}
                        isSelected={selectedRunes.subStyleId === style.id}
                        onClick={() => onStyleChange(style.id)}
                        small
                    />
                ))}
            </div>

            {subStyle && (
                <div className="space-y-6 animate-fadeIn px-2">
                    {subStyle.slots.slice(1).map((slot: any, slotIdx: number) => (
                        <div key={slotIdx} className="flex justify-center gap-4">
                            {slot.runes.map((rune: any) => {
                                const isSelected = selectedRunes.selectedPerkIds[4] === rune.id || selectedRunes.selectedPerkIds[5] === rune.id;
                                return (
                                    <RuneIcon
                                        key={rune.id}
                                        rune={rune}
                                        isSelected={isSelected}
                                        onClick={() => onRuneClick(rune.id)}
                                        size={40}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export interface ShardSelectorProps {
    selectedRunes: SelectedRunes;
    onPerkSelect: (index: number, perkId: number) => void;
    SHARDS: any[];
}

export const ShardSelector = ({ selectedRunes, onPerkSelect, SHARDS }: ShardSelectorProps) => (
    <div className="mt-8 pt-8 border-t border-white/5">
        <div className="flex flex-col gap-4 items-center">
            {SHARDS.map((shardRow, rowIdx) => (
                <div key={rowIdx} className="flex gap-6">
                    {shardRow.options.map((shard: any) => (
                        <RuneIcon
                            key={shard.id}
                            rune={shard}
                            isSelected={selectedRunes.selectedPerkIds[6 + rowIdx] === shard.id}
                            onClick={() => onPerkSelect(6 + rowIdx, shard.id)}
                            size={32}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);
