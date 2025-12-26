import React from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import { Item } from '../../types';

interface BuilderItemSlotProps {
    item: Item | null;
    index: number;
    onRemove: (index: number) => void;
    onDragStart: (e: React.DragEvent, source: 'catalog' | 'slot', data: Item | number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetIndex: number) => void;
}

export const BuilderItemSlot: React.FC<BuilderItemSlotProps> = ({ item, index, onRemove, onDragStart, onDragOver, onDrop }) => {
    return (
        <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className={`aspect-square rounded-[1.5rem] border-2 flex items-center justify-center relative group transition-all duration-300 ${item
                ? 'border-lol-gold bg-[#080808] shadow-glow-gold'
                : 'border-white/5 bg-[#080808]/50 border-dashed hover:border-white/20'
                }`}
        >
            {item ? (
                <div
                    draggable
                    onDragStart={(e) => onDragStart(e, 'slot', index)}
                    className="w-full h-full relative cursor-grab active:cursor-grabbing p-1.5"
                >
                    <Image src={item.imageUrl} width={96} height={96} alt={item.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center rounded-[1.2rem]">
                        <button
                            onClick={() => onRemove(index)}
                            className="text-white opacity-0 group-hover:opacity-100 hover:text-lol-red transition-all transform scale-0 group-hover:scale-100 bg-black/50 rounded-full p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-64 bg-[#121212] border border-lol-gold p-4 rounded-2xl shadow-xl z-[100] hidden group-hover:block animate-fadeIn pointer-events-none">
                        <div className="font-bold text-lol-gold mb-2 font-display text-lg">{item.name}</div>
                        <div className="text-xs text-gray-300 space-y-1">
                            {Object.entries(item.stats || {}).map(([key, val]) => (
                                val ? <div key={key} className="flex justify-between uppercase text-[10px] font-bold"><span>{key}</span> <span className="text-white">+{val}</span></div> : null
                            ))}
                        </div>
                        {item.passive && <div className="text-[10px] text-gray-400 border-t border-gray-800 mt-3 pt-2"><span className="text-lol-gold font-bold">Passif:</span> {item.passive}</div>}
                    </div>
                </div>
            ) : (
                <Plus className="w-8 h-8 text-gray-800 group-hover:text-gray-600 transition-colors" />
            )}
        </div>
    );
};
