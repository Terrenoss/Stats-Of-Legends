import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env and .env.local
const envPath = path.join(__dirname, '../.env');
const envLocalPath = path.join(__dirname, '../.env.local');

if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath, override: true });

import { riotFetchRaw, PLATFORM_MAP } from '../services/RiotService';

const REGION = 'EUW1';
const QUEUE = 'RANKED_SOLO_5x5';
const TIER = 'IRON';
const DIVISION = 'IV';

async function main() {
    const platform = PLATFORM_MAP[REGION] || REGION.toLowerCase();
    const url = `https://${platform}.api.riotgames.com/lol/league-exp/v4/entries/${QUEUE}/${TIER}/${DIVISION}?page=1`;

    console.log(`Fetching from: ${url}`);
    const res = await riotFetchRaw(url);

    if (!res.ok) {
        console.error(`Error: ${res.status}`);
        return;
    }

    const data = JSON.parse(res.body || '[]');
    if (data.length > 0) {
        console.log("First Entry Keys:", Object.keys(data[0]));
        console.log("First Entry Sample:", JSON.stringify(data[0], null, 2));
    } else {
        console.log("No entries found.");
    }
}

main();
