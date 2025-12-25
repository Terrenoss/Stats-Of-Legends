import { PrismaClient } from '@prisma/client';
import { MatchProcessor } from '../services/MatchProcessor';
import { fetchMatchIds, riotFetchRaw, REGION_ROUTING, PLATFORM_MAP } from '../services/RiotService';

// Initialize Prisma
const prisma = new PrismaClient();

// Configuration
const REGION = 'EUW1';
const ROUTING = REGION_ROUTING[REGION];
const QUEUE = 'RANKED_SOLO_5x5';
const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
const DIVISIONS = ['I', 'II', 'III', 'IV'];
const TARGET_MATCHES_PER_TIER = 1000; // Adjust as needed
const MATCHES_PER_PLAYER = 100;

// Helper to delay execution (Rate Limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRandomPlayers(tier: string, division: string, count: number) {
    // Use league-exp-v4 for lower tiers, league-v4 for Apex tiers
    let url;
    if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
        url = `https://${PLATFORM_MAP[REGION]}.api.riotgames.com/lol/league/v4/${tier.toLowerCase()}leagues/by-queue/${QUEUE}`;
    } else {
        url = `https://${PLATFORM_MAP[REGION]}.api.riotgames.com/lol/league-exp/v4/entries/${QUEUE}/${tier}/${division}?page=1`;
    }

    try {
        const res = await riotFetchRaw(url);
        if (!res.ok) {
            console.error(`Failed to fetch players for ${tier} ${division}: ${res.status}`);
            return [];
        }
        const data = JSON.parse(res.body || '[]');
        // Apex tiers return { entries: [] }
        const entries = Array.isArray(data) ? data : data.entries;

        // Shuffle and pick
        const shuffled = entries.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    } catch (e) {
        console.error(`Error fetching players: ${e}`);
        return [];
    }
}

async function processPlayer(entry: any, tier: string) {
    const summonerId = entry.summonerId;

    // Get PUUID
    const sumUrl = `https://${PLATFORM_MAP[REGION]}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`;
    const sumRes = await riotFetchRaw(sumUrl);
    if (!sumRes.ok) return 0;
    const summoner = JSON.parse(sumRes.body || '{}');
    const puuid = summoner.puuid;

    // Get Matches
    const matchIds = await fetchMatchIds(puuid, ROUTING, 0, MATCHES_PER_PLAYER);

    let processedCount = 0;
    for (const matchId of matchIds) {
        // Check if already processed
        const existing = await prisma.match.findUnique({ where: { id: matchId } });
        if (existing) continue;

        console.log(`Processing ${matchId} [${tier}]...`);

        // Fetch Match Details
        const matchUrl = `https://${ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const mRes = await riotFetchRaw(matchUrl);
        if (!mRes.ok) continue;

        const matchData = JSON.parse(mRes.body || '{}');

        // Process
        try {
            await MatchProcessor.processMatch(matchId, REGION, tier, matchData);

            // Also save to Match table to avoid re-fetching (optional, but good for cache)
            // We only save the ID and basic info to mark it as "seen" by our system logic
            // Actually MatchProcessor creates ChampionStats, but doesn't necessarily create a Match record
            // unless we want to keep the JSON. For stats only, we don't strictly need the Match record,
            // but it helps to know we've seen it.
            // Let's create a ScannedMatch record if it doesn't exist (MatchProcessor does this check?)
            // MatchProcessor checks `ScannedMatch`. Let's ensure we create it.

            await prisma.scannedMatch.upsert({
                where: { id: matchId },
                update: {},
                create: { id: matchId, patch: matchData.info.gameVersion, tier: tier }
            });

            processedCount++;
        } catch (err) {
            console.error(`Failed to process ${matchId}:`, err);
        }

        await delay(1200); // Rate limit safety
    }

    return processedCount;
}

async function main() {
    console.log("Starting Database Seeding...");

    for (const tier of TIERS) {
        console.log(`\n--- Seeding Tier: ${tier} ---`);
        let matchesProcessed = 0;

        // For Apex tiers, division is ignored
        const divisions = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier) ? ['I'] : DIVISIONS;

        for (const division of divisions) {
            if (matchesProcessed >= TARGET_MATCHES_PER_TIER) break;

            console.log(`Fetching players from ${tier} ${division}...`);
            const players = await fetchRandomPlayers(tier, division, 5); // Fetch 5 players at a time

            for (const player of players) {
                if (matchesProcessed >= TARGET_MATCHES_PER_TIER) break;

                const count = await processPlayer(player, tier);
                matchesProcessed += count;
                console.log(`  > Processed ${count} matches for ${player.summonerName}. Total for ${tier}: ${matchesProcessed}`);

                await delay(1000);
            }
        }
    }

    console.log("\nSeeding Complete!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
