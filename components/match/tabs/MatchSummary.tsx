import React from 'react';
import Image from 'next/image';
import { Participant, MatchTeam } from '../../../types';
import { TRANSLATIONS } from '../../../constants';
import { SafeLink } from '../../ui/SafeLink';
import { ExternalLink } from 'lucide-react';

interface MatchSummaryProps {
    participants: Participant[];
    maxDamage: number;
    maxTaken: number;
    ranks: Record<string, any>; // puuid -> rank data
    lang: string;
    region: string;
    gameDurationSeconds: number;
    teams?: MatchTeam[];
}

import { TeamSummary, ObjectiveIcon, TeamObjectives } from './MatchSummaryComponents';

export const MatchSummary: React.FC<MatchSummaryProps> = ({ participants, maxDamage, maxTaken, ranks, lang, region, gameDurationSeconds, teams }) => {
    const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];

    const team100 = participants.filter(p => p.teamId === 100);
    const team200 = participants.filter(p => p.teamId === 200);
    const team100Win = team100.length ? !!team100[0].win : false;
    const team200Win = team200.length ? !!team200[0].win : false;

    // Calculate totals for header
    const t100Kills = team100.reduce((a, b) => a + b.kills, 0);
    const t200Kills = team200.reduce((a, b) => a + b.kills, 0);
    const t100Gold = team100.reduce((a, b) => a + (b.goldEarned || 0), 0);
    const t200Gold = team200.reduce((a, b) => a + (b.goldEarned || 0), 0);

    return (
        <div className="flex flex-col gap-4">
            {/* Header Totals */}
            <div className="flex items-center justify-between bg-[#121212] p-4 rounded-lg border border-white/5 min-h-[80px]">
                {/* Blue Team Stats */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className={`font-bold text-lg ${team100Win ? 'text-blue-400' : 'text-red-400'}`}>{team100Win ? 'Victory' : 'Defeat'}</span>
                        <div className="flex gap-2 text-sm">
                            <span className="text-gray-400">{t100Kills} Kills</span>
                            <span className="text-lol-gold">{t100Gold.toLocaleString()} Gold</span>
                        </div>
                    </div>

                    {/* Blue Objectives */}
                    {teams && <TeamObjectives teams={teams} teamId={100} align="left" />}
                </div>

                {/* Red Team Stats */}
                <div className="flex items-center gap-6">
                    {/* Red Objectives */}
                    {teams && <TeamObjectives teams={teams} teamId={200} align="right" />}

                    <div className="flex flex-col items-end">
                        <span className={`font-bold text-lg ${team200Win ? 'text-blue-400' : 'text-red-400'}`}>{team200Win ? 'Victory' : 'Defeat'}</span>
                        <div className="flex gap-2 text-sm">
                            <span className="text-lol-gold">{t200Gold.toLocaleString()} Gold</span>
                            <span className="text-gray-400">{t200Kills} Kills</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Summoner</div>
                <div className="col-span-1 text-center">Score</div>
                <div className="col-span-2 text-center">KDA</div>
                <div className="col-span-2 text-center">Dégâts</div>
                <div className="col-span-1 text-center">Vision/CS</div>
                <div className="col-span-3 text-right">Items</div>
            </div>

            <TeamSummary
                teamId={100}
                teamName="Blue Team"
                isWin={team100Win}
                players={team100}
                maxDamage={maxDamage}
                maxTaken={maxTaken}
                ranks={ranks}
                region={region}
                gameDurationSeconds={gameDurationSeconds}
            />
            <TeamSummary
                teamId={200}
                teamName="Red Team"
                isWin={team200Win}
                players={team200}
                maxDamage={maxDamage}
                maxTaken={maxTaken}
                ranks={ranks}
                region={region}
                gameDurationSeconds={gameDurationSeconds}
            />
        </div>
    );
};
