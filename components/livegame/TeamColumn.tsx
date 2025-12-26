import React from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';
import { assignRoles, SPELL_MAP } from '../../utils/liveGameUtils';
import { getChampionIconUrl, getSpellIconUrl } from '../../utils/ddragon';

interface TeamColumnProps {
    teamId: number;
    color: 'blue' | 'red';
    participants: any[];
    summonerName: string;
    t: any;
    version: string;
    championsById: any;
}

export const TeamColumn: React.FC<TeamColumnProps> = ({ teamId, color, participants, summonerName, t, version, championsById }) => {
    const teamParticipants = participants.filter((p: any) => p.teamId === teamId);
    const assignedRoles = assignRoles(teamParticipants);
    const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

    const getChampImg = (id: number) =>
        getChampionIconUrl(championsById?.[id] || 'Aatrox', version);

    const getSpellImg = (id: number) =>
        getSpellIconUrl(SPELL_MAP[id] || 'SummonerFlash', version);

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
                            <Image
                                src={getChampImg(p.championId)}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg border border-gray-700"
                                alt="Champion"
                            />
                            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                                <Image src={getSpellImg(p.spell1Id)} width={16} height={16} className="w-4 h-4 rounded border border-gray-600" alt="Spell 1" />
                                <Image src={getSpellImg(p.spell2Id)} width={16} height={16} className="w-4 h-4 rounded border border-gray-600" alt="Spell 2" />
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
