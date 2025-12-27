import { useState, useRef } from 'react';
import { fetchWithBackoff } from '../utils/scannerUtils';

interface UseAdminScannerProps {
    secretKey: string;
    selectedRegion: string;
    selectedTier: string;
    selectedDivision: string;
    rateLimit: number;
    currentPatch: string;
}

export function useAdminScanner(props: UseAdminScannerProps) {
    const {
        secretKey,
        selectedRegion,
        selectedTier,
        selectedDivision,
        rateLimit,
        currentPatch
    } = props;

    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ matches: 0, champions: 0, errors: 0 });
    const scanningRef = useRef(false);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
    };



    const processMatch = async (matchId: string) => {
        if (!scanningRef.current) return 'stop';

        addLog(`Processing ${matchId}...`);
        const processRes = await fetchWithBackoff('/api/admin/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': secretKey },
            body: JSON.stringify({ matchId, region: selectedRegion, tier: selectedTier })
        }, scanningRef, addLog);

        const result = await processRes.json();
        if (result.status === 'processed') {
            if (currentPatch && result.patch && !result.patch.startsWith(currentPatch.split('.').slice(0, 2).join('.'))) {
                addLog(`⚠️ Match ${matchId} is on patch ${result.patch} (Target: ${currentPatch}). Stopping player scan.`);
                return 'stop_patch_mismatch';
            }
            setStats(s => ({ ...s, matches: s.matches + 1 }));
            addLog(`✅ Analyzed ${matchId}`);
        } else if (result.status === 'skipped') {
            // addLog(`⏭️ Skipped ${matchId}`);
        } else {
            setStats(s => ({ ...s, errors: s.errors + 1 }));
            addLog(`❌ Error ${matchId}: ${result.error}`);
        }
        return 'continue';
    };

    const processPlayer = async (entry: any) => {
        if (!scanningRef.current) return;

        const id = entry.puuid || entry.summonerId;
        const type = entry.puuid ? 'puuid' : 'summonerId';
        const name = entry.summonerName || id.slice(0, 8);

        addLog(`Fetching matches for ${name}...`);

        const matchRes = await fetchWithBackoff(`/api/admin/matches?${type}=${id}&region=${selectedRegion}`, { headers: { 'x-admin-key': secretKey } }, scanningRef, addLog);

        if (!matchRes.ok) {
            addLog(`⚠️ Failed to fetch matches for ${name}`);
            return;
        }

        const { matchIds } = await matchRes.json();

        // Loop Matches
        for (const matchId of matchIds) {
            if (!scanningRef.current) break;
            const result = await processMatch(matchId);
            if (result === 'stop_patch_mismatch') break;

            // Rate limit buffer
            const delay = 1000 / rateLimit;
            await new Promise(r => setTimeout(r, delay));
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

            const seedRes = await fetchWithBackoff(url, { headers: { 'x-admin-key': secretKey } }, scanningRef, addLog);
            if (!seedRes.ok) {
                const errData = await seedRes.json().catch(() => ({}));
                throw new Error(errData.error || `Failed to fetch seed: ${seedRes.status}`);
            }
            const { entries, debug } = await seedRes.json();
            addLog(`Found ${entries.length} players.`);

            // 2. Loop Players
            for (const entry of entries) {
                if (!scanningRef.current) break;
                await processPlayer(entry);
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

    return {
        isScanning,
        logs,
        stats,
        startScan,
        stopScan,
        handleReset
    };
}
