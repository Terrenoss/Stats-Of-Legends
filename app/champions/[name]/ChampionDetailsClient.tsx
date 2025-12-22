'use client';

import React, { useState, useEffect } from 'react';
import { ChampionService } from '@/services/ChampionService';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

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
    const [rank, setRank] = useState(searchParams.get('rank') || 'CHALLENGER');
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
                    const patch = res.patch || '14.24.1';
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

    const topItems = getTopItems(stats.items, 10);
    const topSpells = getTopItems(stats.spells, 4);
    const topRunes = getTopItems(stats.runes, 10);

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

    const getRuneIcon = (id: number) => {
        if (!runeMap[id]) return 'https://ddragon.leagueoflegends.com/cdn/14.24.1/img/rune/8000.png'; // Fallback
        return `https://ddragon.leagueoflegends.com/cdn/img/${runeMap[id]}`;
    };

    const getShardIcon = (id: number) => {
        const map: Record<number, string> = {
            5001: 'StatModsHealthPlusIcon.png',
            5002: 'StatModsArmorIcon.png',
            5003: 'StatModsMagicResIcon.png',
            5005: 'StatModsAttackSpeedIcon.png',
            5008: 'StatModsAdaptiveForceIcon.png',
            5007: 'StatModsCDRScalingIcon.png',
            5010: 'StatModsMovementSpeedIcon.png',
            5011: 'StatModsTenacityIcon.png',
            5013: 'StatModsHealthScalingIcon.png'
        };
        return map[id] ? `https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/${map[id]}` : '';
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
                                src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${championName}.png`}
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
                                    <img
                                        key={spell.id}
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/spell/${getSpellName(spell.id)}.png`}
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
                                {getRoleIcon(role) && <img src={getRoleIcon(role)} className="w-5 h-5 mr-2 opacity-70" alt={role} />}
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

                {/* Toughest Matchups (Bar) */}
                <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Toughest Matchups <span className="text-gray-500 font-normal text-sm ml-2">These champions counter {championName}</span></h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {data.matchups?.slice(0, 10).map((m: any) => (
                            <div key={m.opponentId} className="flex-shrink-0 w-24 bg-[#1a1a1a] rounded-lg p-3 text-center border border-white/5">
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${m.opponentId}.png`}
                                    className="w-12 h-12 rounded-full mx-auto mb-2 border border-white/10"
                                />
                                <div className="font-bold text-sm truncate">{m.opponentId}</div>
                                <div className="text-red-400 font-bold text-sm">{m.winRate.toFixed(1)}%</div>
                                <div className="text-[10px] text-gray-500">{m.matches} Matches</div>
                            </div>
                        ))}
                        {(!data.matchups || data.matchups.length === 0) && <div className="text-gray-500 text-sm">No matchup data yet.</div>}
                    </div>
                </div>

                {/* Skill Priority & Path (Full Width) */}
                <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Priority */}
                        <div className="w-full md:w-auto md:min-w-[250px] flex-shrink-0">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Skill Priority</h3>
                            {data.skillOrders && data.skillOrders.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    {/* Infer priority from most common path */}
                                    {(() => {
                                        const path = data.skillOrders[0].path.split('-');
                                        const counts = { Q: 0, W: 0, E: 0 };
                                        path.slice(0, 9).forEach((k: string) => { if (['Q', 'W', 'E'].includes(k)) counts[k as keyof typeof counts]++ });
                                        const priority = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(e => e[0]);

                                        return (
                                            <div className="flex items-center gap-2 text-2xl font-bold">
                                                <span className="w-10 h-10 bg-lol-blue/20 rounded flex items-center justify-center border border-lol-blue text-lol-blue">{priority[0]}</span>
                                                <span className="text-gray-500">→</span>
                                                <span className="w-10 h-10 bg-[#222] rounded flex items-center justify-center border border-white/10">{priority[1]}</span>
                                                <span className="text-gray-500">→</span>
                                                <span className="w-10 h-10 bg-[#222] rounded flex items-center justify-center border border-white/10">{priority[2]}</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="text-sm text-gray-400 ml-4">
                                        <div className="text-green-400 font-bold">{data.skillOrders[0].winRate.toFixed(2)}% WR</div>
                                        <div>{data.skillOrders[0].matches} Matches</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500">No skill data.</div>
                            )}
                        </div>

                        {/* Path Grid */}
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Skill Path</h3>
                            {data.topSkillPath && data.topSkillPath.length > 0 ? (
                                <div className="w-full">
                                    {/* Header Row (Levels) */}
                                    <div className="flex mb-2 ml-8">
                                        {Array.from({ length: 18 }).map((_, i) => (
                                            <div key={i} className="flex-1 text-center text-[10px] text-gray-500 font-mono">{i + 1}</div>
                                        ))}
                                    </div>
                                    {/* Rows for Q, W, E, R */}
                                    {['Q', 'W', 'E', 'R'].map((skill) => (
                                        <div key={skill} className="flex items-center mb-1 w-full">
                                            <div className="w-8 font-bold text-gray-400 text-sm flex-shrink-0">{skill}</div>
                                            <div className="flex flex-1">
                                                {Array.from({ length: 18 }).map((_, i) => {
                                                    const active = data.topSkillPath[i] === skill;
                                                    return (
                                                        <div key={i} className="flex-1 h-8 flex items-center justify-center border border-white/5 bg-[#1a1a1a]">
                                                            {active && (
                                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shadow-lg ${skill === 'Q' ? 'bg-blue-600 text-white' :
                                                                    skill === 'W' ? 'bg-green-600 text-white' :
                                                                        skill === 'E' ? 'bg-purple-600 text-white' :
                                                                            'bg-red-600 text-white'
                                                                    }`}>
                                                                    {skill}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">No path data.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Runes Section (Full Width) */}
                <div className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header Tab */}
                    <div className="flex items-center justify-between bg-[#1a1a1a] px-6 py-3 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-white">Recommended</h3>
                            <div className="flex gap-1">
                                {data.runePages && data.runePages.length > 0 && (
                                    <>
                                        <img src={getRuneIcon(data.runePages[0].primaryStyle)} className="w-5 h-5" />
                                        <img src={getRuneIcon(data.runePages[0].subStyle)} className="w-5 h-5" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {data.runePages && data.runePages.length > 0 ? (
                        <div className="p-6">
                            {data.runePages.slice(0, 1).map((page: any, idx: number) => {
                                // Find full tree data
                                const primaryTree = allRunes.find((t: any) => t.id === page.primaryStyle);
                                const subTree = allRunes.find((t: any) => t.id === page.subStyle);

                                return (
                                    <div key={idx}>
                                        {/* Header Info */}
                                        <div className="flex justify-between items-center mb-6 border-l-4 border-lol-blue pl-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-white">{championName} Runes</h4>
                                                <div className="text-sm text-gray-500">{role} Build</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-white">{page.winRate.toFixed(2)}% WR</div>
                                                <div className="text-sm text-gray-500">{page.matches.toLocaleString()} Matches</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Primary Tree */}
                                            <div className="bg-[#161616] rounded-xl p-8 border border-white/5">
                                                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
                                                    <img src={getRuneIcon(page.primaryStyle)} className="w-10 h-10" />
                                                    <span className="text-2xl font-bold text-white">{primaryTree?.name || 'Primary'}</span>
                                                </div>

                                                <div className="space-y-8">
                                                    {primaryTree?.slots.map((slot: any, sIdx: number) => (
                                                        <div key={sIdx} className="flex justify-between items-center px-4">
                                                            {slot.runes.map((rune: any) => {
                                                                const active = page.perks.includes(rune.id);
                                                                return (
                                                                    <div key={rune.id} className="relative group">
                                                                        <img
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                            className={`w-14 h-14 rounded-full border-2 transition-all ${active ? 'border-lol-gold opacity-100 scale-110 shadow-[0_0_15px_rgba(200,155,60,0.5)]' : 'border-transparent opacity-30 grayscale hover:opacity-60'}`}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Secondary Tree */}
                                            <div className="bg-[#161616] rounded-xl p-8 border border-white/5">
                                                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/5">
                                                    <img src={getRuneIcon(page.subStyle)} className="w-10 h-10" />
                                                    <span className="text-2xl font-bold text-white">{subTree?.name || 'Secondary'}</span>
                                                </div>

                                                <div className="space-y-8 mb-10">
                                                    {subTree?.slots.slice(1).map((slot: any, sIdx: number) => (
                                                        <div key={sIdx} className="flex justify-between items-center px-4">
                                                            {slot.runes.map((rune: any) => {
                                                                const active = page.perks.includes(rune.id);
                                                                return (
                                                                    <div key={rune.id} className="relative group">
                                                                        <img
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                            className={`w-12 h-12 rounded-full border-2 transition-all ${active ? 'border-lol-blue opacity-100 scale-110 shadow-[0_0_15px_rgba(0,200,255,0.5)]' : 'border-transparent opacity-30 grayscale hover:opacity-60'}`}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Shards (Stat Mods) */}
                                                <div className="pt-8 border-t border-white/5">
                                                    <div className="space-y-4">
                                                        {[
                                                            [5008, 5005, 5007], // Offense: Adaptive, AS, Haste
                                                            [5008, 5010, 5001], // Flex: Adaptive, Move Speed, Health
                                                            [5001, 5011, 5013]  // Defense: Health, Tenacity, Slow Resist (New Shards)
                                                        ].map((rowIds, rowIdx) => (
                                                            <div key={rowIdx} className="flex justify-center gap-8">
                                                                {rowIds.map((shardId) => {
                                                                    // Positional Check: Shards are the last 3 elements of page.perks
                                                                    // Row 0 -> index -3 (Offense)
                                                                    // Row 1 -> index -2 (Flex)
                                                                    // Row 2 -> index -1 (Defense)
                                                                    // Fallback to includes() if perks array is short (old data)
                                                                    let active = false;
                                                                    if (page.perks.length >= 9) {
                                                                        const shardIndex = page.perks.length - 3 + rowIdx;
                                                                        active = page.perks[shardIndex] === shardId;
                                                                    } else {
                                                                        // Fallback for old data (might show duplicates but better than nothing)
                                                                        active = page.perks.includes(shardId) || (page.statPerks && Object.values(page.statPerks).includes(shardId));
                                                                    }

                                                                    const iconUrl = getShardIcon(shardId);
                                                                    return (
                                                                        <div key={shardId} className={`relative w-12 h-12 rounded-full border-2 transition-all ${active ? 'border-white opacity-100 scale-110 bg-[#333]' : 'border-transparent opacity-20 grayscale bg-[#222]'}`}>
                                                                            {iconUrl && <img src={iconUrl} className="w-full h-full p-1" />}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-sm p-6">No rune data available.</div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Runes & Spells */}
                    <div className="space-y-8">


                        {/* Summoner Spells */}
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-lol-blue pl-3">Summoner Spells</h3>
                            <div className="flex gap-4">
                                {topSpells.slice(0, 2).map(spell => (
                                    <div key={spell.id} className="relative group">
                                        <img
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/spell/${getSpellName(spell.id)}.png`}
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



                        {/* Item Build Path */}
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 overflow-x-auto">
                            <h3 className="text-lg font-bold text-white mb-6 border-l-4 border-lol-gold pl-3">Item Build Path</h3>

                            <div className="flex flex-col gap-8">
                                {/* Top Row: Starting & Core */}
                                <div className="flex flex-col xl:flex-row gap-8 border-b border-white/5 pb-8">
                                    {/* Starting Items */}
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-lol-blue mb-4 border-l-2 border-lol-blue pl-2">Starting Items</h4>
                                        {data.startingItems && data.startingItems.length > 0 ? (
                                            <div className="space-y-3">
                                                {data.startingItems.map((group: any, idx: number) => {
                                                    // Stack items logic
                                                    const stackedItems: { id: number; count: number }[] = [];
                                                    group.items.forEach((id: number) => {
                                                        const existing = stackedItems.find(i => i.id === id);
                                                        if (existing) existing.count++;
                                                        else stackedItems.push({ id, count: 1 });
                                                    });

                                                    return (
                                                        <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                                            <div className="flex -space-x-2">
                                                                {stackedItems.map((item, i) => (
                                                                    <div key={i} className="relative z-10">
                                                                        <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item.id}.png`} className="w-10 h-10 rounded-full border-2 border-[#121212]" />
                                                                        {item.count > 1 && (
                                                                            <div className="absolute -bottom-1 -right-1 bg-[#121212] text-white text-[10px] font-bold px-1 rounded-full border border-white/20">
                                                                                x{item.count}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-green-400 font-bold text-sm">{group.winRate.toFixed(1)}% WR</div>
                                                                <div className="text-[10px] text-gray-500">{group.matches} Matches</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm">No data.</div>
                                        )}
                                    </div>

                                    {/* Core Items */}
                                    <div className="flex-[2]">
                                        <h4 className="text-sm font-bold text-lol-gold mb-4 border-l-2 border-lol-gold pl-2">Core Items</h4>
                                        {data.itemPaths && data.itemPaths.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Most Frequent Core */}
                                                <div className="flex items-center justify-between bg-lol-gold/5 p-4 rounded-lg border border-lol-gold/20">
                                                    <div className="flex items-center gap-4">
                                                        {data.itemPaths[0].path.map((id: number, i: number) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${id}.png`} className="w-14 h-14 rounded border border-lol-gold shadow-lg" />
                                                                {i < data.itemPaths[0].path.length - 1 && <span className="text-gray-600 text-xl">→</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-bold text-2xl">{data.itemPaths[0].winRate.toFixed(2)}% WR</div>
                                                        <div className="text-sm text-gray-500">{data.itemPaths[0].matches} Matches</div>
                                                        <div className="text-xs text-lol-gold uppercase tracking-wider font-bold mt-1">Best Core</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">No core build data.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Row: Options */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { title: '4th Item Options', data: data.slot4 },
                                        { title: '5th Item Options', data: data.slot5 },
                                        { title: '6th Item Options', data: data.slot6 }
                                    ].map((slot, idx) => (
                                        <div key={idx}>
                                            <h4 className="text-sm font-bold text-purple-400 mb-3 border-l-2 border-purple-400 pl-2">{slot.title}</h4>
                                            {slot.data && slot.data.length > 0 ? (
                                                <div className="space-y-2">
                                                    {slot.data.map((item: any) => (
                                                        <div key={item.id} className="flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors border border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <img src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${item.id}.png`} className="w-10 h-10 rounded border border-white/10" />
                                                                <div className="text-xs text-gray-300 font-bold">
                                                                    {/* Item Name would be nice here */}
                                                                    <span className="text-gray-500">#{item.id}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-green-400 font-bold text-xs">{item.winRate.toFixed(1)}%</div>
                                                                <div className="text-[10px] text-gray-500">{item.matches}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 text-xs italic">Select a core build to see options (or no data yet)</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Duos */}
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-green-500 pl-3">Best Synergies (Duos)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(() => {
                                    // Filter unique duos
                                    const uniqueDuos = data.duos?.filter((d: any, index: number, self: any[]) =>
                                        index === self.findIndex((t) => t.partnerId === d.partnerId)
                                    ).slice(0, 4);

                                    return uniqueDuos?.map((d: any) => (
                                        <div key={d.partnerId} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${d.partnerId}.png`}
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
                    </div>
                </div>
            </div>

        </div >
    );
}
