import React, { useState, useEffect } from 'react';
import { RuneStyle, SelectedRunes } from '../../types';
import { PrimaryPath, SecondaryPath, ShardSelector } from './RuneSelectorComponents';
import { calculateNewSecondaryPerks, cleanRuneData } from '../../utils/builderUtils';

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
                const apiResponse = await fetch(`/api/dd/runes?locale=${lang}`);
                if (apiResponse.ok) {
                    const json = await apiResponse.json();

                    const cleanData = cleanRuneData(json);

                    setStyles(cleanData);
                } else {
                    console.error("Failed to fetch runes:", apiResponse.status);
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

    const handleSecondaryRuneClick = (runeId: number) => {
        if (!subStyle) return;

        const current = [selectedRunes.selectedPerkIds[4], selectedRunes.selectedPerkIds[5]];
        const next = calculateNewSecondaryPerks(runeId, current, subStyle);

        const newPerks = [...selectedRunes.selectedPerkIds];
        newPerks[4] = next[0];
        newPerks[5] = next[1];
        onChange({ ...selectedRunes, selectedPerkIds: newPerks });
    };

    if (loading) return <div className="text-center text-gray-500 p-4">Loading Runes...</div>;

    const primaryStyle = styles.find(s => s.id === selectedRunes.primaryStyleId);
    const subStyle = styles.find(s => s.id === selectedRunes.subStyleId);

    return (
        <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-xl">
            <h3 className="text-lol-gold font-display font-bold uppercase tracking-wide mb-6 text-lg">Runes Reforged</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PrimaryPath
                    styles={styles}
                    selectedRunes={selectedRunes}
                    onStyleChange={handlePrimaryStyleChange}
                    onPerkSelect={handlePerkSelect}
                />

                <SecondaryPath
                    styles={styles}
                    selectedRunes={selectedRunes}
                    onStyleChange={handleSubStyleChange}
                    onRuneClick={handleSecondaryRuneClick}
                />
            </div>

            <ShardSelector
                selectedRunes={selectedRunes}
                onPerkSelect={handlePerkSelect}
                SHARDS={SHARDS}
            />
        </div>
    );
};
