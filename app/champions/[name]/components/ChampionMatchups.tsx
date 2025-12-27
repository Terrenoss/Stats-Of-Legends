
import Image from 'next/image';
import { getChampionIconUrl } from '@/utils/ddragon';
import { CURRENT_PATCH } from '@/constants';

interface ChampionMatchupsProps {
    championName: string;
    matchups: any[];
}

const MATCHUP_ICON_SIZE = 48;

export const ChampionMatchups: React.FC<ChampionMatchupsProps> = ({ championName, matchups }) => {
    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">
                Toughest Matchups <span className="text-gray-500 font-normal text-sm ml-2">These champions counter {championName}</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {matchups?.slice(0, 10).map((m: any) => (
                    <div key={m.opponentId} className="flex-shrink-0 w-24 bg-[#1a1a1a] rounded-lg p-3 text-center border border-white/5">
                        <Image
                            src={getChampionIconUrl(m.opponentId, CURRENT_PATCH)}
                            alt={m.opponentId}
                            width={MATCHUP_ICON_SIZE}
                            height={MATCHUP_ICON_SIZE}
                            className="w-12 h-12 rounded-full mx-auto mb-2 border border-white/10"
                        />
                        <div className="font-bold text-sm truncate">{m.opponentId}</div>
                        <div className="text-red-400 font-bold text-sm">{m.winRate.toFixed(1)}%</div>
                        <div className="text-[10px] text-gray-500">{m.matches} Matches</div>
                    </div>
                ))}
                {(!matchups || matchups.length === 0) && <div className="text-gray-500 text-sm">No matchup data yet.</div>}
            </div>
        </div>
    );
};
