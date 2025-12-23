import React, { useEffect, useState } from 'react';
import { Radio, Shield, Swords, Timer } from 'lucide-react';
import { useI18n } from "../app/LanguageContext";

interface LiveGameProps {
  summonerName: string;
  tag: string;
  region: string;
}

export const LiveGame: React.FC<LiveGameProps> = ({ summonerName, tag, region }) => {
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

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
        const res = await fetch(`/api/spectator?name=${encodeURIComponent(summonerName)}&tag=${encodeURIComponent(tag)}&region=${region}&t=${Date.now()}`);
        const data = await res.json();

        if (!res.ok) {
          console.error('[LiveGame] Error:', data);
          setError(data.error || 'Error fetching live game');
          setGameData(null);
          return;
        }

        if (data.noActiveGame) {
          setGameData(null);
        } else {
          setGameData(data);
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
    `https://ddragon.leagueoflegends.com/cdn/${gameData.version || '14.24.1'}/img/champion/${gameData.championsById?.[id] || 'Aatrox'}.png`;

  const SPELL_MAP: Record<number, string> = {
    1: 'SummonerBoost',
    3: 'SummonerExhaust',
    4: 'SummonerFlash',
    6: 'SummonerHaste',
    7: 'SummonerHeal',
    11: 'SummonerSmite',
    12: 'SummonerTeleport',
    13: 'SummonerMana',
    14: 'SummonerDot',
    21: 'SummonerBarrier',
    32: 'SummonerSnowball'
  };

  const getSpellImg = (id: number) =>
    `https://ddragon.leagueoflegends.com/cdn/${gameData.version || '14.24.1'}/img/spell/${SPELL_MAP[id] || 'SummonerFlash'}.png`;

  const assignRoles = (participants: any[]) => {
    const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
    const assignments: Record<string, any> = {
      TOP: null, JUNGLE: null, MID: null, ADC: null, SUPPORT: null
    };

    const unassigned = [...participants];

    // Helper to calculate score for a player in a role
    const getScore = (p: any, role: string) => {
      let score = 0;
      // Main Role Match
      if (p.inferredRole === role) score += 10;

      // Smite -> Jungle (Strong Bonus)
      const hasSmite = p.spell1Id === 11 || p.spell2Id === 11;
      if (role === 'JUNGLE' && hasSmite) score += 50;

      // Penalty for assigning Smite to Non-Jungle (unless forced)
      if (role !== 'JUNGLE' && hasSmite) score -= 20;

      return score;
    };

    // Greedy Assignment: Find best player for each role
    // We iterate roles and pick the highest scoring player available
    // But order matters. Jungle is most constrained (Smite).
    const PRIORITY_ORDER = ['JUNGLE', 'SUPPORT', 'ADC', 'MID', 'TOP'];

    for (const role of PRIORITY_ORDER) {
      let bestPlayerIndex = -1;
      let bestScore = -100;

      unassigned.forEach((p, i) => {
        const score = getScore(p, role);
        if (score > bestScore) {
          bestScore = score;
          bestPlayerIndex = i;
        }
      });

      if (bestPlayerIndex !== -1 && bestScore > 0) {
        assignments[role] = unassigned[bestPlayerIndex];
        unassigned.splice(bestPlayerIndex, 1);
      }
    }

    // Fill remaining slots with remaining players (Top to Bottom)
    ROLES.forEach(role => {
      if (!assignments[role] && unassigned.length > 0) {
        assignments[role] = unassigned.shift();
      }
    });

    return assignments;
  };

  const TeamColumn = ({ teamId, color }: { teamId: number; color: string }) => {
    const teamParticipants = gameData.participants.filter((p: any) => p.teamId === teamId);
    const assignedRoles = assignRoles(teamParticipants);
    const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

    return (
      <div className="flex flex-col gap-2">
        <div
          className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${color === 'blue' ? 'text-blue-400' : 'text-red-400'
            }`}
        >
          <Shield className="w-4 h-4" /> {color === 'blue' ? t.blueTeam : t.redTeam}
        </div>
        {ROLES.map((role) => {
          const p = assignedRoles[role];
          if (!p) return (
            <div key={role} className="h-[74px] flex items-center justify-center bg-[#18181b]/50 border border-white/5 rounded-xl text-gray-700 text-xs uppercase tracking-widest">
              {role}
            </div>
          );

          return (
            <div
              key={role}
              className={`flex items-center gap-3 p-3 rounded-xl border ${p.summonerName === summonerName
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
                  <img src={getSpellImg(p.spell1Id)} className="w-4 h-4 rounded border border-gray-600" alt="Spell 1" />
                  <img src={getSpellImg(p.spell2Id)} className="w-4 h-4 rounded border border-gray-600" alt="Spell 2" />
                </div>
              </div>
              <div>
                <div
                  className={`font-bold text-sm ${p.summonerName === summonerName ? 'text-lol-gold' : 'text-white'
                    }`}
                >
                  {p.summonerName}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{p.rank}</span>
                  <span className="text-[8px] text-gray-600 px-1 py-0.5 bg-white/5 rounded border border-white/5">{role}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
                .filter((ban: any) => ban.teamId === 100)
                .map((ban: any, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-blue-500/30 bg-black/50 grayscale opacity-70"
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
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-red-400 uppercase font-bold mb-1">{t.redTeam} Bans</span>
            <div className="flex gap-1">
              {gameData.bannedChampions
                .filter((ban: any) => ban.teamId === 200)
                .map((ban: any, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-red-500/30 bg-black/50 grayscale opacity-70"
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
