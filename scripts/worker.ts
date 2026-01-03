
import { PrismaClient } from '@prisma/client';
import { LeagueService } from '../services/LeagueService';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use a local prisma instance or import from lib if possible. 
// Since we are in scripts/, importing from ../lib/prisma might work if it doesn't use aliases.
// But let's just instantiate here to be safe and simple for the script.
const prisma = new PrismaClient();

async function processJob(job: any) {
    console.log(`[Worker] Processing job ${job.id} (${job.type})...`);
    try {
        if (job.type === 'UPDATE_LEADERBOARD') {
            const { region } = job.payload || {};
            if (!region) throw new Error('Missing region in payload');

            await LeagueService.updateLeaderboard(region);
        } else {
            console.warn(`[Worker] Unknown job type: ${job.type}`);
        }
    } catch (e) {
        console.error(`[Worker] Job ${job.id} failed:`, e);
        throw e;
    }
}

async function worker() {
    console.log('[Worker] Started. Waiting for jobs...');

    // Handle graceful shutdown
    let running = true;
    process.on('SIGINT', () => {
        console.log('[Worker] Stopping...');
        running = false;
    });

    while (running) {
        try {
            // Fetch highest priority pending job
            const job = await prisma.job.findFirst({
                where: { status: 'PENDING' },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'asc' }
                ]
            });

            if (job) {
                // Lock the job
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'PROCESSING' }
                });

                try {
                    await processJob(job);
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { status: 'COMPLETED' }
                    });
                    console.log(`[Worker] Job ${job.id} completed.`);
                } catch (e) {
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { status: 'FAILED', error: String(e) }
                    });
                }
            } else {
                // Sleep 5s if no jobs
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (err) {
            console.error('[Worker] Error in loop:', err);
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    await prisma.$disconnect();
}

worker();
