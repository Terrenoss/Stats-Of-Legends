/**
 * ------------------------------------------------------------------
 * DATABASE SEEDING SCRIPT
 * ------------------------------------------------------------------
 * 
 * This script populates the database with match data by:
 * 1. Fetching random players from specific Tiers/Divisions.
 * 2. Downloading their recent matches.
 * 3. Processing matches to update Champion, Matchup, and Duo statistics.
 * 4. Tracking scanned players in the database to avoid redundancy.
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Default run (EUW1, All Tiers, 3 Threads):
 *    npx ts-node scripts/seed_database.ts
 * 
 * 2. Specific Region and Tier:
 *    npx ts-node scripts/seed_database.ts --region=NA1 --tier=GOLD
 * 
 * 3. High Performance (5 Threads):
 *    npx ts-node scripts/seed_database.ts --concurrency=5
 * 
 * 4. Target by Players (e.g., 50 players per tier):
 *    npx ts-node scripts/seed_database.ts --players=50 --matches=100
 * 
 * ------------------------------------------------------------------
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env and .env.local
const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

// Suppress RiotService logs to keep progress bar clean
process.env.SUPPRESS_RIOT_LOGS = 'true';

import { PrismaClient } from '@prisma/client';
import { MatchProcessor } from '../services/MatchProcessor';
import { fetchMatchIds, riotFetchRaw, REGION_ROUTING, PLATFORM_MAP, mapWithConcurrency } from '../services/RiotService';
import { CURRENT_PATCH } from '../constants/config';

// Check API Key
if (!process.env.RIOT_API_KEY) {
    console.error("❌ ERROR: RIOT_API_KEY is missing from .env or .env.local");
    process.exit(1);
} else {
    console.log("✅ API Key loaded: " + process.env.RIOT_API_KEY.substring(0, 5) + "...");
}

// Initialize Prisma
const prisma = new PrismaClient();

// --- CONFIGURATION & DEFAULTS ---
const DEFAULTS = {
    REGION: 'EUW1',
    TIER: 'ALL',        // 'ALL' or specific tier (e.g., 'GOLD')
    CONCURRENCY: '3',   // Number of parallel match requests
    MATCHES_PER_PLAYER: '100',
    TARGET_MATCHES_PER_TIER: '5000',
    PLAYERS_PER_TIER: '0' // Default 0 means use TARGET_MATCHES_PER_TIER
};

// --- CLI ARGUMENT PARSING ---
const args = process.argv.slice(2);
const getArg = (key: string, def: string) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split('=')[1] : def;
};

const CONFIG = {
    REGION: getArg('region', DEFAULTS.REGION),
    TIER: getArg('tier', DEFAULTS.TIER),
    CONCURRENCY: parseInt(getArg('concurrency', DEFAULTS.CONCURRENCY)),
    MATCHES_PER_PLAYER: parseInt(getArg('matches', DEFAULTS.MATCHES_PER_PLAYER)),
    TARGET_MATCHES_PER_TIER: parseInt(getArg('target', DEFAULTS.TARGET_MATCHES_PER_TIER)),
    PLAYERS_PER_TIER: parseInt(getArg('players', DEFAULTS.PLAYERS_PER_TIER)),
    // Derived
    ROUTING: REGION_ROUTING[getArg('region', DEFAULTS.REGION)] || 'europe',
    QUEUE: 'RANKED_SOLO_5x5'
};

// Determine Mode
const MODE = CONFIG.PLAYERS_PER_TIER > 0 ? 'PLAYERS' : 'MATCHES';
const TARGET_PER_TIER = MODE === 'PLAYERS' ? CONFIG.PLAYERS_PER_TIER : CONFIG.TARGET_MATCHES_PER_TIER;

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIVISIONS = ['I', 'II', 'III', 'IV'];

console.log(`
---------------------------------------
🚀 STARTING SEEDING SCRIPT
---------------------------------------
Region      : ${CONFIG.REGION}
Routing     : ${CONFIG.ROUTING}
Target Tier : ${CONFIG.TIER}
Concurrency : ${CONFIG.CONCURRENCY} threads
Matches/User: ${CONFIG.MATCHES_PER_PLAYER}
Mode        : ${MODE}
Target      : ${TARGET_PER_TIER} ${MODE === 'PLAYERS' ? 'Players' : 'Matches'} / Tier
---------------------------------------
`);

// Helper to delay execution (Rate Limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- GLOBAL PROGRESS STATE ---
let GLOBAL_PROCESSED = 0; // Can be players or matches depending on mode
let TOTAL_TARGET_GLOBAL = 0;
let GLOBAL_START_TIME = 0;

// Shared State for Ticker
const CurrentProgress = {
    tier: '',
    tierCurrent: 0,
    tierTotal: 0,
    active: false
};

// --- PROGRESS BAR HELPER ---
function updateProgressBar(tier: string, tierCurrent: number, tierTotal: number) {
    const width = 20;

    // Tier Progress
    const tierPct = Math.min(1, tierCurrent / tierTotal);
    const tierPctStr = Math.round(tierPct * 100) + '%';

    // Global Progress
    const globalPct = Math.min(1, GLOBAL_PROCESSED / TOTAL_TARGET_GLOBAL);
    const filled = Math.round(width * globalPct);
    const empty = width - filled;
    const bar = '▓'.repeat(filled) + '░'.repeat(empty);
    const globalPctStr = Math.round(globalPct * 100) + '%';

    // Speed & ETA
    const elapsedSeconds = (Date.now() - GLOBAL_START_TIME) / 1000;
    const speed = elapsedSeconds > 1 ? (GLOBAL_PROCESSED / elapsedSeconds) : 0;
    const speedStr = speed.toFixed(1); // 1 decimal place

    let etaStr = "--:--:--";
    if (speed > 0) {
        const remaining = TOTAL_TARGET_GLOBAL - GLOBAL_PROCESSED;
        const remainingSeconds = remaining / speed;
        const h = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
        etaStr = `${h}:${m}:${s}`;
    }

    // Elapsed Time
    const eH = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
    const eM = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
    const eS = Math.floor(elapsedSeconds % 60).toString().padStart(2, '0');
    const elapsedStr = `${eH}:${eM}:${eS}`;

    const unit = MODE === 'PLAYERS' ? 'Players' : 'Matches';
    const unitShort = MODE === 'PLAYERS' ? 'p/s' : 'm/s';

    // Clear line and write
    // Format: [EUW1] GOLD: 45% | TOTAL: ▓▓▓░░░░░░░ 12% | 12/50 Players | ETA: 04:20:00 | Time: 00:01:30 | 0.5 p/s
    process.stdout.write(`\r[${CONFIG.REGION}] ${tier.padEnd(10)}: ${tierPctStr.padEnd(4)} | TOTAL: ${bar} ${globalPctStr.padEnd(4)} | ${tierCurrent}/${tierTotal} ${unit} | ETA: ${etaStr} | Time: ${elapsedStr} | ${speedStr} ${unitShort}  `);
}

function startProgressTicker() {
    CurrentProgress.active = true;
    const interval = setInterval(() => {
        if (CurrentProgress.active) {
            updateProgressBar(CurrentProgress.tier, CurrentProgress.tierCurrent, CurrentProgress.tierTotal);
        } else {
            clearInterval(interval);
        }
    }, 1000);
}

async function checkConnectivity() {
    console.log(`\n🔌 Checking connectivity to Riot API (${CONFIG.REGION})...`);
    const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();
    const url = `https://${platform}.api.riotgames.com/lol/status/v4/platform-data`;

    try {
        const res = await riotFetchRaw(url);
        if (res.ok) {
            console.log(`✅ Connectivity confirmed!`);
            return true;
        } else {
            console.error(`❌ Connectivity check failed: ${res.status}`);
            return false;
        }
    } catch (e) {
        console.error(`❌ Connectivity check error: ${e}`);
        return false;
    }
}

async function fetchRandomPlayers(tier: string, division: string, count: number, page: number = 1) {
    // Resolve Platform (handle 'EUW' -> 'euw1' and 'euw1' -> 'euw1')
    const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();

    // Use league-v4 (Stable) instead of league-exp-v4 (Experimental)
    // Note: league-v4 requires iterating by queue/tier/division just like exp, but is generally more stable.
    // However, standard league-v4 endpoint is: /lol/league/v4/entries/{queue}/{tier}/{division}
    let url;
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
        // Apex tiers
        if (page > 1) return [];
        url = `https://${platform}.api.riotgames.com/lol/league/v4/${tier.toLowerCase()}leagues/by-queue/${CONFIG.QUEUE}`;
    } else {
        // Standard tiers - Switch to stable v4
        url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/${CONFIG.QUEUE}/${tier}/${division}?page=${page}`;
    }

    const maxRetries = 3;
    let attempt = 1;
    let rateLimitRetries = 0;

    while (attempt <= maxRetries) {
        try {
            const res = await riotFetchRaw(url);

            if (res.ok) {
                const data = JSON.parse(res.body || '[]');
                // Apex tiers return { entries: [] }
                const entries = Array.isArray(data) ? data : data.entries;

                // Shuffle and pick
                const shuffled = entries.sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
            }

            // Handle Rate Limit (429)
            if (res.status === 429) {
                if (rateLimitRetries >= 10) {
                    console.error(`\n❌ Max rate limit retries exceeded for ${tier} ${division}.`);
                    return [];
                }
                console.warn(`\n⏳ Rate Limit Exceeded (429) for ${tier} ${division}. Waiting 120s to clear bucket...`);
                await delay(120000); // Wait 2 minutes to be safe
                rateLimitRetries++;
                continue; // Retry without using up a 'standard' attempt
            }

            // Handle Server Errors (5xx) with Retry
            if (res.status >= 500 && res.status < 600) {
                console.warn(`\n⚠️ Riot API Error ${res.status} for ${tier} ${division} (Page ${page}) - Attempt ${attempt}/${maxRetries}. Retrying in 5s...`);
                await delay(5000);
                attempt++;
                continue;
            }

            // Handle Client Errors (4xx) - Do not retry
            console.error(`\n❌ Failed to fetch players for ${tier} ${division} (Page ${page}): ${res.status}`);
            return [];

        } catch (e) {
            console.error(`\n❌ Error fetching players: ${e}`);
            // Optional: Retry on network errors too?
            if (attempt < maxRetries) {
                await delay(5000);
                attempt++;
                continue;
            }
            return [];
        }
    }
    return [];
}

async function processPlayer(entry: any, tier: string, limit: number, onMatchProcessed: () => void) {
    // API now provides PUUID directly in league-exp-v4, but league-v4 might NOT always have it populated for all regions/endpoints immediately?
    // Actually, league-v4 entries DTO usually has summonerId, and sometimes puuid.
    // If puuid is missing, we must fetch it via summonerId.

    let puuid = entry.puuid;

    if (!puuid) {
        // Fallback: Fetch Summoner by ID to get PUUID
        try {
            // We need to import fetchSummonerById or use raw fetch. 
            // Since we are inside the script, let's just use a raw fetch helper or similar.
            // But wait, we have RiotService helpers imported? 
            // We only imported: fetchMatchIds, riotFetchRaw, REGION_ROUTING, PLATFORM_MAP, mapWithConcurrency

            // Let's do a quick raw fetch for summoner
            const platform = PLATFORM_MAP[CONFIG.REGION] || CONFIG.REGION.toLowerCase();
            const sumUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${entry.summonerId}`;
            const sRes = await riotFetchRaw(sumUrl);
            if (sRes.ok) {
                const sData = JSON.parse(sRes.body || '{}');
                puuid = sData.puuid;
            }
        } catch (e) {
            // console.warn("Failed to fetch PUUID for summonerId:", entry.summonerId);
        }
    }

    if (!puuid) return 0;

    // Get Matches
    // We always fetch up to MATCHES_PER_PLAYER IDs to ensure we have enough candidates,
    // even if we only need a few. Fetching IDs is cheap.
    const matchIds = await fetchMatchIds(puuid, CONFIG.ROUTING, 0, CONFIG.MATCHES_PER_PLAYER);

    // Filter existing matches in DB to avoid re-processing
    const existingMatches = await prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: { id: true }
    });
    const existingIds = new Set(existingMatches.map(m => m.id));
    const newMatchIds = matchIds.filter(id => !existingIds.has(id));

    // Apply Limit if in MATCHES mode
    // If limit is 5, we only take the first 5 new matches.
    const idsToProcess = (MODE === 'MATCHES') ? newMatchIds.slice(0, limit) : newMatchIds;

    let processedCount = 0;

    // Parallel Processing
    await mapWithConcurrency(idsToProcess, CONFIG.CONCURRENCY, async (matchId: string) => {
        const matchUrl = `https://${CONFIG.ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const mRes = await riotFetchRaw(matchUrl);
        if (!mRes.ok) return;

        const matchData = JSON.parse(mRes.body || '{}');

        // OPTIMIZATION: Stop if match is from older patch
        const currentMajorMinor = CURRENT_PATCH.split('.').slice(0, 2).join('.');
        const matchVersion = matchData.info.gameVersion;
        if (!matchVersion.startsWith(currentMajorMinor)) {
            return;
        }

        try {
            await MatchProcessor.processMatch(matchId, CONFIG.REGION, tier, matchData);

            await prisma.scannedMatch.upsert({
                where: { id: matchId },
                update: {},
                create: { id: matchId, patch: matchData.info.gameVersion, tier: tier }
            });

            processedCount++;
            if (MODE === 'MATCHES') {
                onMatchProcessed(); // Update progress bar per match in MATCHES mode
            }
        } catch (err) {
            // console.error(`Failed to process ${matchId}:`, err);
        }

        await delay(200); // Small delay to smooth out burst
    });

    return processedCount;
}

async function main() {
    // Connectivity Check
    const isConnected = await checkConnectivity();
    if (!isConnected) {
        console.error("❌ Aborting: Cannot connect to Riot API.");
        process.exit(1);
    }

    const tiersToProcess = CONFIG.TIER === 'ALL' ? TIERS : [CONFIG.TIER];

    // Calculate Global Target
    TOTAL_TARGET_GLOBAL = tiersToProcess.length * TARGET_PER_TIER;
    GLOBAL_START_TIME = Date.now();

    // Start Ticker
    startProgressTicker();

    for (const tier of tiersToProcess) {
        if (!TIERS.includes(tier)) {
            console.error(`Invalid Tier: ${tier}`);
            continue;
        }

        console.log(`\n--- Seeding Tier: ${tier} ---`);
        let processedForTier = 0; // Players or Matches depending on mode

        // Update Shared State
        CurrentProgress.tier = tier;
        CurrentProgress.tierCurrent = processedForTier;
        CurrentProgress.tierTotal = TARGET_PER_TIER;

        // For Apex tiers, division is ignored
        const divisions = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier) ? ['I'] : DIVISIONS;

        // Initialize Progress Bar
        updateProgressBar(tier, processedForTier, TARGET_PER_TIER);

        for (let i = 0; i < divisions.length; i++) {
            const division = divisions[i];
            if (processedForTier >= TARGET_PER_TIER) break;

            // Balanced Distribution Logic
            // Calculate how many we need from this division to stay on track for equal distribution
            const remainingDivisions = divisions.length - i;
            const remainingTarget = TARGET_PER_TIER - processedForTier;
            const targetForDiv = Math.ceil(remainingTarget / remainingDivisions);

            console.log(`\n🎯 Target for ${tier} ${division}: ${targetForDiv} matches (Remaining Tier Target: ${remainingTarget})`);

            let processedForDiv = 0;
            let page = 1;
            let keepFetching = true;

            while (keepFetching && processedForDiv < targetForDiv) {
                console.log(`\n🔍 Fetching players from ${tier} ${division} (Page ${page})...`);

                // Fetch more players per page to reduce API calls if we need many matches
                const playersToFetch = 10;
                const players = await fetchRandomPlayers(tier, division, playersToFetch, page);

                if (players.length === 0) {
                    // Should not happen normally as per user, but safety break
                    console.warn(`\n⚠️ No more players found in ${tier} ${division}. Moving to next division.`);
                    keepFetching = false;
                    break;
                }

                for (const player of players) {
                    // Check both Tier Target and Division Target
                    if (processedForTier >= TARGET_PER_TIER) break;
                    if (processedForDiv >= targetForDiv) break;

                    if (!player.puuid) continue;

                    // DB CHECK: Has this player been scanned in this region?
                    const alreadyScanned = await prisma.scannedSummoner.findUnique({
                        where: {
                            puuid_region: {
                                puuid: player.puuid,
                                region: CONFIG.REGION
                            }
                        }
                    });

                    if (alreadyScanned) continue;

                    // Calculate Limit for this player
                    // If MATCHES mode: limit is (targetForDiv - processedForDiv)
                    // If PLAYERS mode: limit is just MATCHES_PER_PLAYER (we count players, not matches)
                    const limit = (MODE === 'MATCHES')
                        ? (targetForDiv - processedForDiv)
                        : CONFIG.MATCHES_PER_PLAYER;

                    const matchesCount = await processPlayer(player, tier, limit, () => {
                        // Callback for MATCHES mode updates
                        if (MODE === 'MATCHES') {
                            processedForDiv++;
                            processedForTier++;
                            GLOBAL_PROCESSED++;

                            // Update Shared State
                            CurrentProgress.tierCurrent = processedForTier;

                            updateProgressBar(tier, processedForTier, TARGET_PER_TIER);
                        }
                    });

                    // Update for PLAYERS mode
                    if (MODE === 'PLAYERS') {
                        processedForDiv++;
                        processedForTier++;
                        GLOBAL_PROCESSED++;

                        // Update Shared State
                        CurrentProgress.tierCurrent = processedForTier;

                        updateProgressBar(tier, processedForTier, TARGET_PER_TIER);
                    }

                    // DB SAVE: Mark as scanned
                    await prisma.scannedSummoner.create({
                        data: {
                            puuid: player.puuid,
                            region: CONFIG.REGION
                        }
                    });

                    await delay(1000);
                }

                page++; // Next page
                await delay(1000); // Delay between pages
            }
        }
        // Final newline after tier is done
        console.log("");
    }

    CurrentProgress.active = false; // Stop Ticker
    console.log("\n✅ Seeding Complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        CurrentProgress.active = false; // Ensure ticker stops
        await prisma.$disconnect();
    });
