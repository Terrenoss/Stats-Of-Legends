import React, { useState, useEffect } from 'react';
import { RuneStyle, SelectedRunes, Rune } from '../../types';
import { Check, X } from 'lucide-react';
import { getRuneIconUrl } from '../../utils/ddragon';

interface RuneSelectorProps {
    selectedRunes: SelectedRunes;
    onChange: (runes: SelectedRunes) => void;
    lang?: string;
}

const SHARDS = [
    {
        row: 0,
        options: [
            { id: 5008, key: 'AdaptiveForce', icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force', shortDesc: '+9 Adaptive Force', longDesc: '' },
            { id: 5005, key: 'AttackSpeed', icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png', name: 'Attack Speed', shortDesc: '+10% Attack Speed', longDesc: '' },
            { id: 5007, key: 'AbilityHaste', icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png', name: 'Ability Haste', shortDesc: '+8 Ability Haste', longDesc: '' }
        ]
    },
    {
        row: 1,
        options: [
            { id: 5008, key: 'AdaptiveForce', icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force', shortDesc: '+9 Adaptive Force', longDesc: '' },
            { id: 5010, key: 'MovementSpeed', icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png', name: 'Movement Speed', shortDesc: '+2% Move Speed', longDesc: '' },
            { id: 5001, key: 'HealthScaling', icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Health Scaling', shortDesc: '+10-180 Health', longDesc: '' }
        ]
    },
    {
        row: 2,
        options: [
            { id: 5011, key: 'Health', icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png', name: 'Health', shortDesc: '+65 Health', longDesc: '' },
            { id: 5013, key: 'Tenacity', icon: 'perk-images/StatMods/StatModsTenacityIcon.png', name: 'Tenacity', shortDesc: '+10% Tenacity', longDesc: '' },
            { id: 5001, key: 'HealthScaling', icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Health Scaling', shortDesc: '+10-180 Health', longDesc: '' }
        ]
    }
];

export const RuneSelector: React.FC<RuneSelectorProps> = ({ selectedRunes, onChange, lang = 'fr_FR' }) => {
    const [styles, setStyles] = useState<RuneStyle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRunes() {
            try {
                const res = await fetch(`/api/dd/runes?locale=${lang}`);
                if (res.ok) {
                    const json = await res.json();

                    // Filter out removed runes (Patch 14.10+)
                    const REMOVED_IDS = [8134, 8124, 8008];
                    const cleanData = json.data.map((style: any) => ({
                        ...style,
                        slots: style.slots.map((slot: any) => ({
                            ...slot,
                            runes: slot.runes.filter((rune: any) => !REMOVED_IDS.includes(rune.id))
                        }))
                    }));

                    setStyles(cleanData);
                } else {
                    console.error("Failed to fetch runes:", res.status);
                }
            } catch (e) {
                console.error("Failed to load runes", e);
            } finally {
                setLoading(false);
            }
        }
        loadRunes();
    }, [lang]);

    const handlePrimaryStyleChange = (styleId: number) => {
        // Find first available secondary style (not the selected primary)
        const firstSubStyle = styles.find(s => s.id !== styleId);

        onChange({
            primaryStyleId: styleId,
            subStyleId: firstSubStyle ? firstSubStyle.id : null,
            selectedPerkIds: [null, null, null, null, null, null, null, null, null]
        });
    };

    const handleSubStyleChange = (styleId: number) => {
        // Reset secondary perks when changing secondary style
        const newPerks = [...selectedRunes.selectedPerkIds];
        newPerks[4] = null;
        newPerks[5] = null;
        onChange({
            ...selectedRunes,
            subStyleId: styleId,
            selectedPerkIds: newPerks
        });
    };

    const handlePerkSelect = (index: number, perkId: number) => {
        const newPerks = [...selectedRunes.selectedPerkIds];
        newPerks[index] = perkId;
        onChange({
            ...selectedRunes,
            selectedPerkIds: newPerks
        });
    };

    if (loading) return <div className="text-center text-gray-500 p-4">Loading Runes...</div>;

    const primaryStyle = styles.find(s => s.id === selectedRunes.primaryStyleId);
    const subStyle = styles.find(s => s.id === selectedRunes.subStyleId);

    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl">
            <h3 className="text-lol-gold font-display font-bold uppercase tracking-wide mb-6 text-lg">Runes Reforged</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PRIMARY PATH */}
                <div className="space-y-6">
                    {/* Style Selection */}
                    <div className="flex gap-3 mb-6 justify-center flex-wrap">
                        {styles.map(style => (
                            <button
                                key={style.id}
                                onClick={() => handlePrimaryStyleChange(style.id)}
                                className={`w-12 h-12 flex-shrink-0 aspect-square rounded-full p-2 border-2 transition-all ${selectedRunes.primaryStyleId === style.id
                                    ? 'border-lol-gold bg-lol-gold/10 scale-110 shadow-[0_0_20px_rgba(200,155,60,0.3)]'
                                    : 'border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 grayscale hover:grayscale-0'
                                    }`}
                                title={style.name}
                            >
                                <img src={getRuneIconUrl(style.icon)} alt={style.name} className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>

                    {primaryStyle && (
                        <div className="space-y-6 animate-fadeIn px-2">
                            {/* Keystone (Slot 0) */}
                            <div className="flex justify-center gap-4">
                                {primaryStyle.slots[0].runes.map(rune => (
                                    <RuneIcon
                                        key={rune.id}
                                        rune={rune}
                                        isSelected={selectedRunes.selectedPerkIds[0] === rune.id}
                                        onClick={() => handlePerkSelect(0, rune.id)}
                                        isKeystone
                                        size={60}
                                    />
                                ))}
                            </div>
                            {/* Slot 1 */}
                            <div className="flex justify-center gap-4 border-t border-white/5 pt-6">
                                {primaryStyle.slots[1].runes.map(rune => (
                                    <RuneIcon
                                        key={rune.id}
                                        rune={rune}
                                        isSelected={selectedRunes.selectedPerkIds[1] === rune.id}
                                        onClick={() => handlePerkSelect(1, rune.id)}
                                        size={48}
                                    />
                                ))}
                            </div>
                            {/* Slot 2 */}
                            <div className="flex justify-center gap-4">
                                {primaryStyle.slots[2].runes.map(rune => (
                                    <RuneIcon
                                        key={rune.id}
                                        rune={rune}
                                        isSelected={selectedRunes.selectedPerkIds[2] === rune.id}
                                        onClick={() => handlePerkSelect(2, rune.id)}
                                        size={48}
                                    />
                                ))}
                            </div>
                            {/* Slot 3 */}
                            <div className="flex justify-center gap-4">
                                {primaryStyle.slots[3].runes.map(rune => (
                                    <RuneIcon
                                        key={rune.id}
                                        rune={rune}
                                        isSelected={selectedRunes.selectedPerkIds[3] === rune.id}
                                        onClick={() => handlePerkSelect(3, rune.id)}
                                        size={48}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECONDARY PATH */}
                <div className="space-y-6 border-l border-white/5 pl-4 relative">
                    <div className="flex gap-2 mb-6 justify-center flex-wrap">
                        {styles.filter(s => s.id !== selectedRunes.primaryStyleId).map(style => (
                            <button
                                key={style.id}
                                onClick={() => handleSubStyleChange(style.id)}
                                className={`w-10 h-10 flex-shrink-0 aspect-square rounded-full p-2 border-2 transition-all ${selectedRunes.subStyleId === style.id
                                    ? 'border-lol-gold bg-lol-gold/10 scale-110 shadow-[0_0_15px_rgba(200,155,60,0.3)]'
                                    : 'border-transparent opacity-40 hover:opacity-100 hover:bg-white/5 grayscale hover:grayscale-0'
                                    }`}
                                title={style.name}
                            >
                                <img src={getRuneIconUrl(style.icon)} alt={style.name} className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>

                    {subStyle && (
                        <div className="space-y-6 animate-fadeIn px-2">
                            {/* Rune Rows */}
                            {subStyle.slots.slice(1).map((slot, slotIdx) => (
                                <div key={slotIdx} className="flex justify-center gap-4">
                                    {slot.runes.map(rune => {
                                        const isSelected = selectedRunes.selectedPerkIds[4] === rune.id || selectedRunes.selectedPerkIds[5] === rune.id;
                                        return (
                                            <RuneIcon
                                                key={rune.id}
                                                rune={rune}
                                                isSelected={isSelected}
                                                onClick={() => {
                                                    const current = [selectedRunes.selectedPerkIds[4], selectedRunes.selectedPerkIds[5]];
                                                    let next = [...current];

                                                    // Helper to find row index of a rune
                                                    const getRuneRow = (rId: number | null) => {
                                                        if (!rId) return -1;
                                                        return subStyle.slots.findIndex(s => s.runes.some(r => r.id === rId));
                                                    };

                                                    const clickedRow = slotIdx; // We are inside the map loop, so slotIdx is the row index (relative to subStyle.slots which starts at 1? No, slice(1) means slotIdx is 0, 1, 2 relative to the slice)
                                                    // Actually, let's use the absolute row index from the data to be safe, or just trust the loop.
                                                    // The loop is: subStyle.slots.slice(1).map((slot, slotIdx) => ...
                                                    // So slotIdx is 0 for the first row of secondary (which is actually slot 1 of the style), 1 for next, etc.
                                                    // Let's use the getRuneRow helper for consistency.
                                                    const targetRow = getRuneRow(rune.id);

                                                    if (isSelected) {
                                                        // Deselect
                                                        next = next.map(id => id === rune.id ? null : id);
                                                        // Shift to fill gap
                                                        if (next[0] === null && next[1] !== null) {
                                                            next[0] = next[1];
                                                            next[1] = null;
                                                        }
                                                    } else {
                                                        // Check if we already have a rune from this row
                                                        const existingIndexInRow = next.findIndex(id => getRuneRow(id) === targetRow);

                                                        if (existingIndexInRow !== -1) {
                                                            // Replace the rune in the same row
                                                            next[existingIndexInRow] = rune.id;
                                                        } else {
                                                            // No rune from this row. Add to first empty, or shift if full.
                                                            if (next[0] === null) {
                                                                next[0] = rune.id;
                                                            } else if (next[1] === null) {
                                                                next[1] = rune.id;
                                                            } else {
                                                                // Both full, different rows. Shift: Remove first, add new to second.
                                                                next[0] = next[1];
                                                                next[1] = rune.id;
                                                            }
                                                        }
                                                    }

                                                    const newPerks = [...selectedRunes.selectedPerkIds];
                                                    newPerks[4] = next[0];
                                                    newPerks[5] = next[1];
                                                    onChange({ ...selectedRunes, selectedPerkIds: newPerks });
                                                }}
                                                size={40}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SHARDS */}
            <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex flex-col gap-4 items-center">
                    {SHARDS.map((shardRow, rowIdx) => (
                        <div key={rowIdx} className="flex gap-6">
                            {shardRow.options.map(shard => (
                                <RuneIcon
                                    key={shard.id}
                                    rune={shard}
                                    isSelected={selectedRunes.selectedPerkIds[6 + rowIdx] === shard.id}
                                    onClick={() => handlePerkSelect(6 + rowIdx, shard.id)}
                                    size={32}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RuneIcon = ({ rune, isSelected, onClick, isKeystone, size = 48 }: { rune: Rune, isSelected: boolean, onClick: () => void, isKeystone?: boolean, size?: number }) => (
    <div
        className="relative group cursor-pointer flex-shrink-0 aspect-square flex items-center justify-center"
        onClick={onClick}
        style={{ width: size, height: size }}
    >
        <div className={`w-full h-full rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden ${isSelected
            ? 'border-lol-gold shadow-[0_0_15px_rgba(200,155,60,0.6)] grayscale-0 scale-110 bg-black/50'
            : 'border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-110'}`}>
            <img
                src={getRuneIconUrl(rune.icon)}
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
            <p className="text-[10px] text-gray-400 leading-tight" dangerouslySetInnerHTML={{ __html: rune.shortDesc }}></p>
        </div>
    </div>
);
