
import { prisma } from '@/lib/prisma';

async function main() {
    try {
        const totalMatches = await prisma.summonerMatch.count();
        const matchesWithScore = await prisma.summonerMatch.count({
            where: { legendScore: { gt: 0 } }
        });

        const totalRanks = await prisma.summonerRank.count();
        const ranksWithScore = await prisma.summonerRank.count({
            where: { legendScore: { gt: 0 } }
        });

        console.log(`Total SummonerMatches: ${totalMatches}`);
        console.log(`Matches with Legend Score > 0: ${matchesWithScore}`);
        console.log(`Total SummonerRanks: ${totalRanks}`);
        console.log(`Ranks with Legend Score > 0: ${ranksWithScore}`);

        const sampleMatch = await prisma.summonerMatch.findFirst({
            where: { legendScore: { gt: 0 } },
            take: 1
        });
        console.log('Sample Match with Score:', sampleMatch ? JSON.stringify(sampleMatch, null, 2) : 'None');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
