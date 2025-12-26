import React from 'react';
import Image from 'next/image';
import { getChampionIconUrl } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

interface ChampionDuosProps {
    duos: any[];
}

export const ChampionDuos: React.FC<ChampionDuosProps> = ({ duos }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-green-500 pl-3">Best Synergies (Duos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                    // Filter unique duos
                    const uniqueDuos = duos?.filter((d: any, index: number, self: any[]) =>
                        index === self.findIndex((t) => t.partnerId === d.partnerId)
                    ).slice(0, 4);

                    return uniqueDuos?.map((d: any) => (
                        <div key={d.partnerId} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Image
                                    src={getChampionIconUrl(d.partnerId, CURRENT_PATCH)}
                                    alt={d.partnerId}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-lg border border-white/10"
                                />
                                <div>
                                    <div className="font-bold text-sm">{d.partnerId}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{d.partnerRole}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${d.winRate > 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {d.winRate.toFixed(1)}% WR
                                </div>
                                <div className="text-xs text-gray-500">{d.matches} Matches</div>
                            </div>
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
};
