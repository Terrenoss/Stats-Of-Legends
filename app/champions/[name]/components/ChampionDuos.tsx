
import Image from 'next/image';
import { getChampionIconUrl } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

interface Duo {
    partnerId: string;
    partnerRole: string;
    winRate: number;
    matches: number;
}

interface ChampionDuosProps {
    duos: Duo[];
}

const DUO_ICON_SIZE = 40;
const WINRATE_THRESHOLD = 50;

export const ChampionDuos: React.FC<ChampionDuosProps> = ({ duos }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-green-500 pl-3">Best Synergies (Duos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                    // Filter unique duos
                    const uniqueDuos = duos?.filter((d: Duo, index: number, self: Duo[]) =>
                        index === self.findIndex((t) => t.partnerId === d.partnerId)
                    ).slice(0, 4);

                    return uniqueDuos?.map((d: Duo) => (
                        <div key={d.partnerId} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Image
                                    src={getChampionIconUrl(d.partnerId, CURRENT_PATCH)}
                                    alt={d.partnerId}
                                    width={DUO_ICON_SIZE}
                                    height={DUO_ICON_SIZE}
                                    className="w-10 h-10 rounded-lg border border-white/10"
                                />
                                <div>
                                    <div className="font-bold text-sm">{d.partnerId}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{d.partnerRole}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${d.winRate > WINRATE_THRESHOLD ? 'text-green-400' : 'text-red-400'}`}>
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
