"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Play, Square, Trash2, Activity, Database } from 'lucide-react';
import { CURRENT_PATCH } from '@/constants';
import { useAdminScanner } from '@/hooks/useAdminScanner';

const LoginScreen = ({ secretKey, setSecretKey, handleLogin }: any) => (
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

const DashboardHeader = ({ stats }: any) => (
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
);

const DashboardControls = ({
    selectedRegion, setSelectedRegion,
    selectedTier, setSelectedTier,
    selectedDivision, setSelectedDivision,
    rateLimit, setRateLimit,
    isScanning, startScan, stopScan, handleReset,
    currentPatch, regions, tiers, divisions
}: any) => (
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
                    {regions.map((r: string) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
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
                    {tiers.map((t: string) => <option key={t} value={t}>{t}</option>)}
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
                        {divisions.map((d: string) => <option key={d} value={d}>{d}</option>)}
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
);

const DashboardLogs = ({ logs }: any) => (
    <div className="lg:col-span-2 bg-black/50 rounded-xl border border-white/10 p-4 h-[600px] flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
            <Activity className="w-4 h-4" />
            <span className="font-mono text-sm">Live Logs</span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 pr-2">
            {logs.map((log: string, i: number) => (
                <div key={i} className={`p-2 rounded ${log.includes('ERROR') ? 'bg-red-900/20 text-red-400' : log.includes('✅') ? 'text-green-400' : 'text-gray-300'}`}>
                    {log}
                </div>
            ))}
        </div>
    </div>
);

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [secretKey, setSecretKey] = useState('');

    // Rank Selection
    const [selectedTier, setSelectedTier] = useState('CHALLENGER');
    const [selectedDivision, setSelectedDivision] = useState('I');
    const [selectedRegion, setSelectedRegion] = useState('euw1');
    const [rateLimit, setRateLimit] = useState(20);
    const [currentPatch, setCurrentPatch] = useState('');

    const tiers = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];
    const divisions = ['I', 'II', 'III', 'IV'];
    const regions = ['euw1', 'na1', 'kr', 'eun1', 'br1', 'la1', 'la2', 'oc1', 'ru', 'tr1', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'];

    useEffect(() => {
        // Use fixed patch version
        setCurrentPatch(CURRENT_PATCH);
    }, []);

    const { isScanning, logs, stats, startScan, stopScan, handleReset } = useAdminScanner({
        secretKey,
        selectedRegion,
        selectedTier,
        selectedDivision,
        rateLimit,
        currentPatch
    });

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

    if (!isAuthenticated) {
        return <LoginScreen secretKey={secretKey} setSecretKey={setSecretKey} handleLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <DashboardHeader stats={stats} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <DashboardControls
                        selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
                        selectedTier={selectedTier} setSelectedTier={setSelectedTier}
                        selectedDivision={selectedDivision} setSelectedDivision={setSelectedDivision}
                        rateLimit={rateLimit} setRateLimit={setRateLimit}
                        isScanning={isScanning} startScan={startScan} stopScan={stopScan} handleReset={handleReset}
                        currentPatch={currentPatch} regions={regions} tiers={tiers} divisions={divisions}
                    />
                    <DashboardLogs logs={logs} />
                </div>
            </div>
        </div>
    );
}
