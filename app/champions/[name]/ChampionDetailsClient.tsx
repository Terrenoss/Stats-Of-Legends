'use client';

import React, { useState, useEffect } from 'react';
import { ChampionService } from '@/services/ChampionService';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CURRENT_PATCH } from '@/constants';
import { getChampionIconUrl, getSpellIconUrl } from '@/utils/ddragon';

// Sub-components
import { ChampionMatchups } from './components/ChampionMatchups';
import { ChampionSkillPath } from './components/ChampionSkillPath';
import { ChampionRunes } from './components/ChampionRunes';
import { ChampionBuildPath } from './components/ChampionBuildPath';
import { ChampionDuos } from './components/ChampionDuos';

// Helper for spell images
const getSpellName = (id: string) => {
    const map: Record<string, string> = {
        '4': 'SummonerFlash',
        '14': 'SummonerDot', // Ignite
        '12': 'SummonerTeleport',
        '6': 'SummonerHaste', // Ghost
        '7': 'SummonerHeal',
        '11': 'SummonerSmite',
        '3': 'SummonerExhaust',
        '21': 'SummonerBarrier',
        '1': 'SummonerBoost', // Cleanse
    };
    return map[id] || 'SummonerFlash';
};

// Helper for Role Icons
const getRoleIcon = (role: string) => {
    const map: Record<string, string> = {
        'TOP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-top.png',
        'JUNGLE': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-jungle.png',
        'MID': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-middle.png',
        'ADC': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-bottom.png',
        'SUPPORT': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-icons/icon-position-utility.png',
    };
    return map[role] || '';
};

const ROLES = [
    { id: 'TOP', label: 'Top' },
    { id: 'JUNGLE', label: 'Jungle' },
    { id: 'MID', label: 'Mid' },
    { id: 'ADC', label: 'ADC' },
    { id: 'SUPPORT', label: 'Support' },
];

const TIERS = [
    'CHALLENGER', 'GRANDMASTER', 'MASTER',
    'DIAMOND_PLUS', 'EMERALD_PLUS', 'PLATINUM_PLUS', 'GOLD_PLUS',
    'ALL'
];

const formatTier = (t: string) => {
    if (t === 'ALL') return 'All Ranks';
    if (t.endsWith('_PLUS')) return `${t.replace('_PLUS', '')} +`;
    return t;
};

export default function ChampionDetailsClient({ params }: { params: { name: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const championName = params.name;
    const [role, setRole] = useState(searchParams.get('role') || 'MID');
    const [rank, setRank] = useState(searchParams.get('rank') || 'ALL');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [runeMap, setRuneMap] = useState<Record<number, string>>({});
    const [allRunes, setAllRunes] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await ChampionService.getChampionDetails(championName, role, rank);
                setData(res);

                // Fetch Rune Map
                try {
                    const patch = CURRENT_PATCH;
                    let runeRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`);

                    // Fallback to 14.23.1 if 403/404
                    if (!runeRes.ok) {
                        console.warn(`Failed to fetch runes for patch ${patch}, trying fallback 14.23.1`);
                        runeRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/14.23.1/data/en_US/runesReforged.json`);
                    }

                    if (runeRes.ok) {
                        const runeData = await runeRes.json();
                        setAllRunes(runeData); // Store full rune data
                        const map: Record<number, string> = {};

                        const processTree = (tree: any) => {
                            map[tree.id] = tree.icon;
                            tree.slots.forEach((slot: any) => {
                                slot.runes.forEach((rune: any) => {
                                    map[rune.id] = rune.icon;
                                });
                            });
                        };

                        runeData.forEach(processTree);
                        setRuneMap(map);
                    } else {
                        console.error('Failed to fetch runes (fallback also failed):', runeRes.status);
                    }
                } catch (runeError) {
                    console.error('Error loading runes:', runeError);
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [championName, role, rank]);

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">Loading...</div>;
    if (!data) return <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">No data found</div>;

    const { stats } = data;
    // Use calculated metrics from API
    const winRate = data.winRate.toFixed(2);
    const pickRate = data.pickRate.toFixed(1);
    const banRate = data.banRate.toFixed(1);
    const tier = data.tier;
    const totalMatches = data.stats.matches.toLocaleString();

    // Helper to sort and get top items
    const getTopItems = (items: Record<string, any>, count: number = 6) => {
        return Object.entries(items)
            .sort(([, a], [, b]) => b.matches - a.matches)
            .slice(0, count)
            .map(([id, s]) => ({ id, ...s, wr: ((s.wins / s.matches) * 100).toFixed(1) }));
    };

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

            {/* Header Section */}
            <div className="bg-[#111] border-b border-white/5 pt-8 pb-0">
                <div className="max-w-7xl mx-auto px-8">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/tierlist?rank=ALL')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-bold"
                    >
                        <span>←</span> Back to Tier List
                    </button>

                    <div className="flex items-start gap-6 mb-8">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-lol-gold shadow-[0_0_20px_rgba(200,155,60,0.3)]">
                            <Image
                                src={getChampionIconUrl(championName, CURRENT_PATCH)}
                                alt={championName}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute top-0 left-0 bg-lol-gold text-black text-xs font-bold px-2 py-0.5 rounded-br-lg">
                                {tier}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-display font-bold text-white mb-2 flex items-center gap-4">
                                {championName}
                                <span className="text-2xl font-normal text-gray-400">{role} Build, {formatTier(rank)}</span>
                                <span className="text-xs bg-[#222] text-gray-300 px-2 py-1 rounded border border-white/10">Patch {data.patch}</span>
                            </h1>
                            <div className="flex gap-2 mt-4">
                                {/* Spell Order Visualization (Placeholder using top spells for now) */}
                                {topSpells.slice(0, 2).map(spell => (
                                    <Image
                                        key={spell.id}
                                        src={getSpellIconUrl(getSpellName(spell.id), CURRENT_PATCH)}
                                        alt={`Spell ${spell.id}`}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded border border-white/20"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-8 text-sm font-bold text-gray-400 border-b border-white/10">
                        <button className="pb-4 border-b-2 border-lol-blue text-white">Build</button>
                        <button className="pb-4 hover:text-white transition-colors">Counters</button>
                        <button className="pb-4 hover:text-white transition-colors">Pro Builds</button>
                    </div>
                </div>
            </div>

            {/* Filters & Stats Bar */}
            <div className="bg-[#0f0f0f] border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="relative">
                            <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg px-2">
                                {getRoleIcon(role) && <Image src={getRoleIcon(role)} alt={role} width={20} height={20} className="w-5 h-5 mr-2 opacity-70" />}
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

                    {/* Stats Row */}
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
                    {/* Left Column: Runes & Spells */}
                    <div className="space-y-8">
                        {/* Summoner Spells */}
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Summoner Spells</h3>
                            <div className="flex gap-4">
                                {topSpells.slice(0, 2).map(spell => (
                                    <div key={spell.id} className="relative group">
                                        <Image
                                            src={getSpellIconUrl(getSpellName(spell.id), CURRENT_PATCH)}
                                            alt={`Summoner Spell ${spell.id}`}
                                            width={48}
                                            height={48}
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

        </div >
    );
}
