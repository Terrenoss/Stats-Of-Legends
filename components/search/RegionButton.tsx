import React from 'react';
import { Region } from '../../types';

interface RegionButtonProps {
    region: Region;
    selectedRegion: Region;
    onSelect: (r: Region) => void;
}

export const RegionButton: React.FC<RegionButtonProps> = ({ region, selectedRegion, onSelect }) => {
    const isSelected = selectedRegion === region;
    const btnClass = isSelected
        ? 'bg-lol-gold text-black shadow-glow-gold'
        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white';
    return (
        <button
            type="button"
            onClick={() => onSelect(region)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${btnClass}`}
        >
            {region}
        </button>
    );
};
