
import { PrismaClient } from '@prisma/client';
import { MatchHistoryService } from '../services/MatchHistoryService';
import { } from '../constants/config';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging saveMatchAndStats ---');

    // 1. Get an existing match to use as a template
    const existingMatch = await prisma.match.findFirst({
        where: { jsonData: { not: Prisma.JsonNull } }
    });

    if (!existingMatch) {
        console.error('No existing match found in DB to use as template.');
        return;
    }

    const matchId = existingMatch.id;
    const jsonData = existingMatch.jsonData;
    const puuid = 'TEST_PUUID'; // Dummy PUUID
    const region = 'EUW';

    console.log(`Using match ID: ${matchId}`);
    console.log(`Current averageRank: ${existingMatch.averageRank}`);

    // 2. Call saveMatchAndStats with a specific averageRank
    const testRank = 'PLATINUM';
    console.log(`Attempting to save with averageRank: ${testRank}`);

    try {
        // We pass null for dbSummoner as we are just testing match saving
        await MatchHistoryService.saveMatchAndStats(
            { id: matchId, data: jsonData },
            puuid,
            region,
            null,
            testRank
        );
        console.log('saveMatchAndStats completed.');
    } catch (error) {
        console.error('Error calling saveMatchAndStats:', error);
    }

    // 3. Verify the result
    const updatedMatch = await prisma.match.findUnique({
        where: { id: matchId }
    });

    if (updatedMatch) {
        console.log(`Updated averageRank: ${updatedMatch.averageRank}`);
        if (updatedMatch.averageRank === testRank) {
            console.log('SUCCESS: averageRank was updated correctly.');
        } else {
            console.error('FAILURE: averageRank was NOT updated correctly.');
        }
    } else {
        console.error('Match not found after update?');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

import { Prisma } from '@prisma/client';
