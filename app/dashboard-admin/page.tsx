'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Square, Trash2, Activity, Database } from 'lucide-react';

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secretKey, setSecretKey] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ matches: 0, champions: 0, errors: 0 });

    // Rank Selection
    const [selectedTier, setSelectedTier] = useState('CHALLENGER');
    const [selectedDivision, setSelectedDivision] = useState('I');
    const [selectedRegion, setSelectedRegion] = useState('euw1');
    const [rateLimit, setRateLimit] = useState(20);
    const [currentPatch, setCurrentPatch] = useState('');

    const tiers = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];
    const divisions = ['I', 'II', 'III', 'IV'];
    const regions = ['euw1', 'na1', 'kr', 'eun1', 'br1', 'la1'];

    const scanningRef = useRef(false);

    useEffect(() => {
        // Auto-fetch patch on mount
        fetch('https://ddragon.leagueoflegends.com/api/versions.json')
            .then(res => res.json())
            .then(data => setCurrentPatch(data[0]))
            .catch(err => console.error("Failed to fetch patch", err));
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
    };

    const handleLogin = async () => {
        if (!secretKey) return;

        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: secretKey })
            });

            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                alert("Invalid Admin Key");
            }
        } catch (e) {
            alert("Auth Error");
        }
    };

    const fetchWithBackoff = async (url: string, options?: RequestInit) => {
        while (true) {
            if (!scanningRef.current) throw new Error("Scan stopped");

            const res = await fetch(url, options);
            if (res.status === 429) {
                const data = await res.json();
                const waitMs = data.retryAfter || 5000;
                const waitSeconds = Math.ceil(waitMs / 1000);

                addLog(`⚠️ Rate Limit Hit. Waiting ${waitSeconds}s...`);

                // Countdown
                for (let i = waitSeconds; i > 0; i--) {
                    if (!scanningRef.current) throw new Error("Scan stopped");
                    // setScanStatus(`Rate Limit: Resuming in ${i}s...`);
                    if (i % 10 === 0) addLog(`Rate Limit: Resuming in ${i}s...`);
                    await new Promise(r => setTimeout(r, 1000));
                }

                addLog(`▶️ Resuming scan...`);
                continue; // Retry request
            }
            return res;
        }
    };

    const startScan = async () => {
        if (scanningRef.current) return;
        scanningRef.current = true;
        setIsScanning(true);
        addLog(`Starting Scanner for ${selectedRegion.toUpperCase()} - ${selectedTier} ${selectedDivision}...`);
        addLog(`Target Patch: ${currentPatch}`);

        try {
            // 1. Get Seed Players
            addLog("Fetching Seed Players...");
            let url = `/api/admin/seed?region=${selectedRegion}`;
            if (['DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'].includes(selectedTier)) {
                url += `&tier=${selectedTier}&division=${selectedDivision}`;
            }

            const seedRes = await fetchWithBackoff(url, { headers: { 'x-admin-key': secretKey } });
            if (!seedRes.ok) {
                const errData = await seedRes.json().catch(() => ({}));
                throw new Error(errData.error || `Failed to fetch seed: ${seedRes.status}`);
            }
            const { entries, debug } = await seedRes.json();
            addLog(`Found ${entries.length} players.`);

            // 2. Loop Players
            for (const entry of entries) {
                if (!scanningRef.current) break;

                const id = entry.puuid || entry.summonerId;
                const type = entry.puuid ? 'puuid' : 'summonerId';
                const name = entry.summonerName || id.slice(0, 8);

                addLog(`Fetching matches for ${name}...`);

                const matchRes = await fetchWithBackoff(`/api/admin/matches?${type}=${id}&region=${selectedRegion}`, { headers: { 'x-admin-key': secretKey } });

                if (!matchRes.ok) {
                    addLog(`⚠️ Failed to fetch matches for ${name}`);
                    continue;
                }

                const { matchIds } = await matchRes.json();

                // 3. Loop Matches
                for (const matchId of matchIds) {
                    if (!scanningRef.current) break;

                    addLog(`Processing ${matchId}...`);
                    const processRes = await fetchWithBackoff('/api/admin/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-admin-key': secretKey },
                        body: JSON.stringify({ matchId, region: selectedRegion, tier: selectedTier })
                    });

                    const result = await processRes.json();
                    if (result.status === 'processed') {
                        if (currentPatch && result.patch && !result.patch.startsWith(currentPatch.split('.').slice(0, 2).join('.'))) {
                            addLog(`⚠️ Match ${matchId} is on patch ${result.patch} (Target: ${currentPatch}). Stopping player scan.`);
                            break;
                        }
                        setStats(s => ({ ...s, matches: s.matches + 1 }));
                        addLog(`✅ Analyzed ${matchId}`);
                    } else if (result.status === 'skipped') {
                        // addLog(`⏭️ Skipped ${matchId}`);
                    } else {
                        setStats(s => ({ ...s, errors: s.errors + 1 }));
                        addLog(`❌ Error ${matchId}: ${result.error}`);
                    }

                    // Rate limit buffer
                    const delay = 1000 / rateLimit;
                    await new Promise(r => setTimeout(r, delay));
                }
            }

        } catch (e: any) {
            if (e.message === "Scan stopped") {
                addLog("⏹️ Scan stopped by user.");
            } else {
                addLog(`CRITICAL ERROR: ${e.message}`);
            }
        } finally {
            setIsScanning(false);
            scanningRef.current = false;
            addLog("Scanner Stopped.");
        }
    };

    const stopScan = () => {
        scanningRef.current = false;
        setIsScanning(false);
        addLog("Stopping...");
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to delete ALL database data? This cannot be undone.")) return;

        addLog("Resetting Database...");
        try {
            const res = await fetch('/api/admin/reset', {
                method: 'POST',
                headers: { 'x-admin-key': secretKey }
            });

            if (res.ok) {
                addLog("✅ Database Reset Complete.");
                setStats({ matches: 0, champions: 0, errors: 0 });
            } else {
                addLog("❌ Reset Failed.");
            }
        } catch (e) {
            addLog("❌ Reset Error.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-[#121212] p-8 rounded-2xl border border-white/10 w-full max-w-md space-y-6">
                    <div className="flex justify-center">
                        <Shield className="w-16 h-16 text-lol-gold" />
                    </div>
                    <h1 className="text-2xl font-bold text-center text-white">Admin Access</h1>
                    <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="Enter Admin Key"
                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lol-gold outline-none"
                    />
                    <button
                        onClick={handleLogin}
                        className="w-full bg-lol-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition"
                    >
                        Unlock Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database className="text-lol-gold" />
                        Meta Scanner Control
                    </h1>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">Matches</span>
                            <div className="text-2xl font-mono font-bold text-green-400">{stats.matches}</div>
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">Errors</span>
                            <div className="text-2xl font-mono font-bold text-red-400">{stats.errors}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="bg-[#121212] p-6 rounded-xl border border-white/10 space-y-4">
                            <h2 className="text-xl font-bold text-gray-200">Configuration</h2>

                            {/* Region Selector */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Region</label>
                                <select
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lol-gold outline-none"
                                >
                                    {regions.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                </select>
                            </div>

                            {/* Tier Selector */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Target Tier</label>
                                <select
                                    value={selectedTier}
                                    onChange={(e) => setSelectedTier(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lol-gold outline-none"
                                >
                                    {tiers.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Division Selector (Hidden for Apex Tiers) */}
                            {!['CHALLENGER', 'GRANDMASTER', 'MASTER'].includes(selectedTier) && (
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Division</label>
                                    <select
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lol-gold outline-none"
                                    >
                                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Rate Limit */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Rate Limit (req/s)</label>
                                <input
                                    type="number"
                                    value={rateLimit}
                                    onChange={(e) => setRateLimit(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lol-gold outline-none"
                                />
                            </div>

                            <div className="h-px bg-white/10 my-4" />

                            <div className="flex gap-4">
                                {!isScanning ? (
                                    <button
                                        onClick={startScan}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <Play className="w-5 h-5" /> Start Scan
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopScan}
                                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                    >
                                        <Square className="w-5 h-5" /> Stop
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleReset}
                                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-white/5"
                            >
                                <Trash2 className="w-4 h-4" /> Reset Database
                            </button>
                        </div>

                        <div className="bg-[#121212] p-6 rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold text-gray-200 mb-4">Info</h2>
                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex justify-between"><span>Region</span> <span className="text-white">{selectedRegion.toUpperCase()}</span></div>
                                <div className="flex justify-between"><span>Patch</span> <span className="text-white">{currentPatch || 'Loading...'}</span></div>
                                <div className="flex justify-between"><span>Rate Limit</span> <span className="text-white">{rateLimit}/s</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="lg:col-span-2 bg-black/50 rounded-xl border border-white/10 p-4 h-[600px] flex flex-col">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                            <Activity className="w-4 h-4" />
                            <span className="font-mono text-sm">Live Logs</span>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2">
                            {logs.map((log, i) => (
                                <div key={i} className={`p-2 rounded ${log.includes('ERROR') ? 'bg-red-900/20 text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}`}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
