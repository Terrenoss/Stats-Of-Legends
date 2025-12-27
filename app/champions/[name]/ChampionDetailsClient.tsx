'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CURRENT_PATCH } from '@/constants';
import { getSpellIconUrl } from '@/utils/ddragon';
import { useChampionData } from '@/hooks/useChampionData';

// Sub-components
import { ChampionMatchups } from './components/ChampionMatchups';
import { ChampionSkillPath } from './components/ChampionSkillPath';
import { ChampionRunes } from './components/ChampionRunes';
import { ChampionBuildPath } from './components/ChampionBuildPath';
import { ChampionDuos } from './components/ChampionDuos';
import { ChampionHeader } from './components/ChampionHeader';

import { ROLES, TIERS, formatTier, getSpellName, getRoleIcon, getTopItems } from '@/utils/championUtils';

const ICON_SIZE = 20;
const SPELL_ICON_SIZE = 48;

export default function ChampionDetailsClient({ params }: { params: { name: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const championName = params.name;
    const [role, setRole] = useState(searchParams.get('role') || 'MID');
    const [rank, setRank] = useState(searchParams.get('rank') || 'ALL');

    const { data, loading, runeMap, allRunes } = useChampionData(championName, role, rank);

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">Loading...</div>;
    if (!data) return <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">No data found</div>;

    const { stats } = data;
    // Use calculated metrics from API
    const winRate = data.winRate.toFixed(2);
    const pickRate = data.pickRate.toFixed(1);
    const banRate = data.banRate.toFixed(1);
    const tier = data.tier;
    const totalMatches = data.stats.matches.toLocaleString();

    const topSpells = getTopItems(stats.spells, 4);

    const handleRoleChange = (newRole: string) => {
        setRole(newRole);
        const params = new URLSearchParams(searchParams.toString());
        params.set('role', newRole);
        router.replace(`?${params.toString()}`);
    };

    const handleRankChange = (newRank: string) => {
        setRank(newRank);
        const params = new URLSearchParams(searchParams.toString());
        params.set('rank', newRank);
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white pb-32">

            <ChampionHeader
                championName={championName}
                role={role}
                rank={rank}
                tier={tier}
                patch={data.patch}
                topSpells={topSpells}
                formatTier={formatTier}
                getSpellName={getSpellName}
            />

            <div className="bg-[#0f0f0f] border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="flex gap-4">
                        <div className="relative">
                            <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg px-2">
                                {getRoleIcon(role) && <Image src={getRoleIcon(role)} alt={role} width={ICON_SIZE} height={ICON_SIZE} className="w-5 h-5 mr-2 opacity-70" />}
                                <select
                                    value={role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className="appearance-none bg-transparent py-2 pr-8 text-sm font-bold focus:outline-none text-white"
                                >
                                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                        </div>
                        <div className="relative">
                            <select
                                value={rank}
                                onChange={(e) => handleRankChange(e.target.value)}
                                className="appearance-none bg-[#1a1a1a] border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm font-bold focus:outline-none focus:border-lol-gold/50"
                            >
                                {TIERS.map(t => <option key={t} value={t}>{formatTier(t)}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                        </div>
                    </div>

                    <div className="flex gap-12 text-center">
                        <div>
                            <div className={`text-2xl font-bold ${tier === 'S+' || tier === 'S' ? 'text-lol-gold' : 'text-white'}`}>{tier}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Tier</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{winRate}%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Win Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">N/A</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Rank</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{pickRate}%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Pick Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{banRate}%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Ban Rate</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{totalMatches}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Matches</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

                <ChampionMatchups championName={championName} matchups={data.matchups} />

                <ChampionSkillPath skillOrders={data.skillOrders} topSkillPath={data.topSkillPath} />

                <ChampionRunes
                    championName={championName}
                    role={role}
                    runePages={data.runePages}
                    allRunes={allRunes}
                    runeMap={runeMap}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-8">
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Summoner Spells</h3>
                            <div className="flex gap-4">
                                {topSpells.slice(0, 2).map(spell => (
                                    <div key={spell.id} className="relative group">
                                        <Image
                                            src={getSpellIconUrl(getSpellName(spell.id), CURRENT_PATCH)}
                                            alt={`Summoner Spell ${spell.id}`}
                                            width={SPELL_ICON_SIZE}
                                            height={SPELL_ICON_SIZE}
                                            className="w-12 h-12 rounded-lg border border-white/10"
                                        />
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                            {spell.wr}% WR
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Skills & Items */}
                    <div className="lg:col-span-2 space-y-8">
                        <ChampionBuildPath
                            startingItems={data.startingItems}
                            itemPaths={data.itemPaths}
                            slot4={data.slot4}
                            slot5={data.slot5}
                            slot6={data.slot6}
                        />

                        <ChampionDuos duos={data.duos} />
                    </div>
                </div>
            </div>

        </div>
    );
}
