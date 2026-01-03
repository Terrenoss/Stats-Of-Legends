
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load .env as fallback/supplement

import { LeagueService } from '../services/LeagueService';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- Triggering Leaderboard Update (Job) ---');

    try {
        // Create a background job
        const job = await prisma.job.create({
            data: {
                type: 'UPDATE_LEADERBOARD',
                payload: { region: 'EUW1' },
                priority: 1, // Low priority
                status: 'PENDING'
            }
        });
        console.log(`Job created successfully: ${job.id}`);
        console.log('Run "npm run worker" (or ts-node scripts/worker.ts) to process it.');
    } catch (error: any) {
        console.error('Failed to create job:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
