import React from 'react';
import Image from 'next/image';
import { getItemIconUrl } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

interface ChampionBuildPathProps {
    startingItems: any[];
    itemPaths: any[];
    slot4: any[];
    slot5: any[];
    slot6: any[];
}

const StackedItem = ({ item }: { item: { id: number; count: number } }) => (
    <div className="relative z-10">
        <Image src={getItemIconUrl(item.id, CURRENT_PATCH)} alt={`Item ${item.id}`} width={40} height={40} className="w-10 h-10 rounded-full border-2 border-[#121212]" />
        {item.count > 1 && (
            <div className="absolute -bottom-1 -right-1 bg-[#121212] text-white text-[10px] font-bold px-1 rounded-full border border-white/20">
                x{item.count}
            </div>
        )}
    </div>
);

const StartingItemGroup = ({ group }: { group: any }) => {
    const stackedItems: { id: number; count: number }[] = [];
    group.items.forEach((id: number) => {
        const existing = stackedItems.find(i => i.id === id);
        if (existing) existing.count++;
        else stackedItems.push({ id, count: 1 });
    });

    return (
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
            <div className="flex -space-x-2">
                {stackedItems.map((item, i) => (
                    <StackedItem key={i} item={item} />
                ))}
            </div>
            <div className="text-right">
                <div className="text-green-400 font-bold text-sm">{group.winRate.toFixed(1)}% WR</div>
                <div className="text-[10px] text-gray-500">{group.matches} Matches</div>
            </div>
        </div>
    );
};

const StartingItems = ({ items }: { items: any[] }) => {
    if (!items || items.length === 0) return <div className="text-gray-500 text-sm">No data.</div>;

    return (
        <div className="space-y-3">
            {items.map((group: any, idx: number) => (
                <StartingItemGroup key={idx} group={group} />
            ))}
        </div>
    );
};

const CoreItems = ({ items }: { items: any[] }) => {
    if (!items || items.length === 0) return <div className="text-gray-500">No core build data.</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-lol-gold/5 p-4 rounded-lg border border-lol-gold/20">
                <div className="flex items-center gap-4">
                    {items[0].path.map((id: number, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                            <Image src={getItemIconUrl(id, CURRENT_PATCH)} alt={`Core Item ${id}`} width={56} height={56} className="w-14 h-14 rounded border border-lol-gold shadow-lg" />
                            {i < items[0].path.length - 1 && <span className="text-gray-600 text-xl">→</span>}
                        </div>
                    ))}
                </div>
                <div className="text-right">
                    <div className="text-green-400 font-bold text-2xl">{items[0].winRate.toFixed(2)}% WR</div>
                    <div className="text-sm text-gray-500">{items[0].matches} Matches</div>
                    <div className="text-xs text-lol-gold uppercase tracking-wider font-bold mt-1">Best Core</div>
                </div>
            </div>
        </div>
    );
};

const ItemOptions = ({ slot4, slot5, slot6 }: { slot4: any[], slot5: any[], slot6: any[] }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { title: '4th Item Options', data: slot4 },
                { title: '5th Item Options', data: slot5 },
                { title: '6th Item Options', data: slot6 }
            ].map((slot, idx) => (
                <div key={idx}>
                    <h4 className="text-sm font-bold text-purple-400 mb-3 border-l-2 border-purple-400 pl-2">{slot.title}</h4>
                    {slot.data && slot.data.length > 0 ? (
                        <div className="space-y-2">
                            {slot.data.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Image src={getItemIconUrl(item.id, CURRENT_PATCH)} alt={`Item ${item.id}`} width={40} height={40} className="w-10 h-10 rounded border border-white/10" />
                                        <div className="text-xs text-gray-300 font-bold">
                                            <span className="text-gray-500">#{item.id}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold text-xs">{item.winRate.toFixed(1)}%</div>
                                        <div className="text-[10px] text-gray-500">{item.matches}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-xs italic">Select a core build to see options (or no data yet)</div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const ChampionBuildPath: React.FC<ChampionBuildPathProps> = ({ startingItems, itemPaths, slot4, slot5, slot6 }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-white mb-6 border-l-4 border-lol-gold pl-3">Item Build Path</h3>

            <div className="flex flex-col gap-8">
                {/* Top Row: Starting & Core */}
                <div className="flex flex-col xl:flex-row gap-8 border-b border-white/5 pb-8">
                    {/* Starting Items */}
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-lol-blue mb-4 border-l-2 border-lol-blue pl-2">Starting Items</h4>
                        <StartingItems items={startingItems} />
                    </div>

                    {/* Core Items */}
                    <div className="flex-[2]">
                        <h4 className="text-sm font-bold text-lol-gold mb-4 border-l-2 border-lol-gold pl-2">Core Items</h4>
                        <CoreItems items={itemPaths} />
                    </div>
                </div>

                {/* Bottom Row: Options */}
                <ItemOptions slot4={slot4} slot5={slot5} slot6={slot6} />
            </div>
        </div>
    );
};
