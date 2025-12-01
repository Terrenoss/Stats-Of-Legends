import React, { useEffect, useState } from 'react';
import { Radio, Shield, Swords, Timer } from 'lucide-react';
import { useI18n } from "../app/LanguageContext";

interface LiveGameProps {
  summonerName: string;
}

export const LiveGame: React.FC<LiveGameProps> = ({ summonerName }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchLiveGame = async () => {
      try {
        const res = await fetch(`/api/spectator?summoner=${encodeURIComponent(summonerName)}`);
        if (!res.ok) {
          setGameData(null);
          return;
        }
        const data = await res.json();
        if (!data || data.error || data.status === 'NOT_FOUND' || data.noActiveGame) {
          setGameData(null);
        } else {
          setGameData(data);
        }
      } catch (e) {
        console.error(e);
        setGameData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveGame();
  }, [summonerName]);

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lol-gold" />
      </div>
    );

  if (!gameData)
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-[#121212] border border-white/5 rounded-[2rem]">
        <Radio className="w-16 h-16 text-gray-700 mb-6" />
        <h3 className="text-2xl font-display font-bold text-gray-500 uppercase tracking-wider">
          {t.noActiveGame}
        </h3>
      </div>
    );

  const duration = Math.floor((Date.now() - gameData.gameStartTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const getChampImg = (id: number) =>
    `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${gameData.championsById?.[id] || 'Aatrox'}.png`;

  const TeamColumn = ({ teamId, color }: { teamId: number; color: string }) => (
    <div className="flex flex-col gap-2">
      <div
        className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
          color === 'blue' ? 'text-blue-400' : 'text-red-400'
        }`}
      >
        <Shield className="w-4 h-4" /> {color === 'blue' ? t.blueTeam : t.redTeam}
      </div>
      {gameData.participants
        .filter((p: any) => p.teamId === teamId)
        .map((p: any, i: number) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              p.summonerName === summonerName
                ? 'bg-lol-gold/10 border-lol-gold'
                : 'bg-[#18181b] border-white/5'
            }`}
          >
            <div className="relative">
              <img
                src={getChampImg(p.championId)}
                className="w-10 h-10 rounded-lg border border-gray-700"
                alt="Champion"
              />
              <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                <div className="w-4 h-4 bg-black rounded border border-gray-600" />
                <div className="w-4 h-4 bg-black rounded border border-gray-600" />
              </div>
            </div>
            <div>
              <div
                className={`font-bold text-sm ${
                  p.summonerName === summonerName ? 'text-lol-gold' : 'text-white'
                }`}
              >
                {p.summonerName}
              </div>
              <div className="text-[10px] text-gray-500">{p.rank}</div>
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 mb-8 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-full bg-lol-gold/5 blur-3xl" />

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2 text-lol-red font-bold text-xs uppercase tracking-widest animate-pulse">
            <div className="w-2 h-2 rounded-full bg-lol-red" /> {t.liveLabel}
          </div>
          <h2 className="text-2xl font-display font-bold text-white">{t.rankedSoloDuo}</h2>
          <span className="text-gray-500 text-sm">{t.summonersRift}</span>
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="text-3xl font-mono font-bold text-white tracking-widest flex items-center gap-2">
            <Timer className="w-6 h-6 text-lol-gold" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-bold mt-1">{t.gameTime}</span>
        </div>

        <div className="hidden md:flex flex-col items-end z-10">
          <span className="text-xs text-gray-500 uppercase font-bold mb-2">{t.bannedChampions}</span>
          <div className="flex gap-1">
            {gameData.bannedChampions.map((ban: any, i: number) => (
              <div
                key={i}
                className="w-8 h-8 rounded border border-white/10 bg-black/50 grayscale opacity-70"
              >
                <img
                  src={getChampImg(ban.championId)}
                  className="w-full h-full object-cover opacity-60"
                  alt="Ban"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121212] border border-white/10 rounded-full p-2 z-10 hidden md:block">
          <Swords className="w-6 h-6 text-gray-500" />
        </div>

        <TeamColumn teamId={100} color="blue" />
        <TeamColumn teamId={200} color="red" />
      </div>
    </div>
  );
};
