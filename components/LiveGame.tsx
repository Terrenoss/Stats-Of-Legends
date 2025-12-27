import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Radio, Shield, Swords, Timer } from 'lucide-react';
import { useLanguage } from "../app/LanguageContext";
import { TRANSLATIONS } from '../constants';
import { getChampionIconUrl } from '../utils/ddragon';
import { TeamColumn } from './livegame/TeamColumn';

interface LiveGameProps {
  summonerName: string;
  tag: string;
  region: string;
}

export const LiveGame: React.FC<LiveGameProps> = ({ summonerName, tag, region }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLiveGame = async () => {
      setLoading(true);
      setError(null);
      try {
        // Add timestamp to prevent caching
        const spectatorResponse = await fetch(`/api/spectator?name=${encodeURIComponent(summonerName)}&tag=${encodeURIComponent(tag)}&region=${region}&t=${Date.now()}`);
        const liveGameData = await spectatorResponse.json();

        if (!spectatorResponse.ok) {
          console.error('[LiveGame] Error:', liveGameData);
          setError(liveGameData.error || 'Error fetching live game');
          setGameData(null);
          return;
        }

        if (liveGameData.noActiveGame) {
          setGameData(null);
        } else {
          setGameData(liveGameData);
        }
      } catch (e) {
        console.error('[LiveGame] Network Error:', e);
        setError('Network error');
        setGameData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveGame();
  }, [summonerName, tag, region]);

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lol-gold" />
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-[#121212] border border-white/5 rounded-[2rem]">
        <Shield className="w-16 h-16 text-red-500 mb-6" />
        <h3 className="text-xl font-display font-bold text-red-400 uppercase tracking-wider mb-2">
          {t.error || 'Error'}
        </h3>
        <p className="text-gray-500">{error}</p>
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

  const duration = now ? Math.floor((now - gameData.gameStartTime) / 1000) : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const getChampImg = (id: number) =>
    getChampionIconUrl(gameData.championsById?.[id] || 'Aatrox', gameData.version);

  const CHAMPION_ICON_SIZE = 32;

  interface BannedChampion {
    championId: number;
    teamId: number;
    pickTurn: number;
  }

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

        <div className="hidden md:flex flex-col items-end z-10 gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-400 uppercase font-bold mb-1">{t.blueTeam} Bans</span>
            <div className="flex gap-1">
              {gameData.bannedChampions
                .filter((ban: BannedChampion) => ban.teamId === 100)
                .map((ban: BannedChampion, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-blue-500/30 bg-black/50 grayscale opacity-70"
                  >
                    <Image
                      src={getChampImg(ban.championId)}
                      width={CHAMPION_ICON_SIZE}
                      height={CHAMPION_ICON_SIZE}
                      className="w-full h-full object-cover opacity-60"
                      alt="Ban"
                    />
                  </div>
                ))}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-red-400 uppercase font-bold mb-1">{t.redTeam} Bans</span>
            <div className="flex gap-1">
              {gameData.bannedChampions
                .filter((ban: BannedChampion) => ban.teamId === 200)
                .map((ban: BannedChampion, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-red-500/30 bg-black/50 grayscale opacity-70"
                  >
                    <Image
                      src={getChampImg(ban.championId)}
                      width={CHAMPION_ICON_SIZE}
                      height={CHAMPION_ICON_SIZE}
                      className="w-full h-full object-cover opacity-60"
                      alt="Ban"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121212] border border-white/10 rounded-full p-2 z-10 hidden md:block">
          <Swords className="w-6 h-6 text-gray-500" />
        </div>

        <TeamColumn
          teamId={100}
          color="blue"
          participants={gameData.participants}
          summonerName={summonerName}
          t={t}
          version={gameData.version}
          championsById={gameData.championsById}
        />
        <TeamColumn
          teamId={200}
          color="red"
          participants={gameData.participants}
          summonerName={summonerName}
          t={t}
          version={gameData.version}
          championsById={gameData.championsById}
        />
      </div>
    </div>
  );
};
