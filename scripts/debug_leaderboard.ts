
import { prisma } from '../lib/prisma';
import { LeaderboardService } from '../services/LeaderboardService';

async function main() {
    console.log('--- Debugging Leaderboard Sorting ---');

    // Test calculation logic directly
    console.log('\n1. Testing calculateRankValue logic:');

    const testCases = [
        { tier: 'CHALLENGER', rank: 'I', lp: 1500 },
        { tier: 'CHALLENGER', rank: 'I', lp: 1000 },
        { tier: 'GRANDMASTER', rank: 'I', lp: 800 },
        { tier: 'MASTER', rank: 'I', lp: 500 },
        { tier: 'MASTER', rank: 'I', lp: 0 },
        { tier: 'DIAMOND', rank: 'I', lp: 50 },
        { tier: 'DIAMOND', rank: 'IV', lp: 0 },
    ];

    testCases.forEach(tc => {
        const val = LeaderboardService.calculateRankValue(tc.tier, tc.rank, tc.lp);
        console.log(`${tc.tier} ${tc.rank} ${tc.lp}LP => ${val}`);
    });

    // Check DB contents
    console.log('\n2. Checking DB contents (Top 20 by LP):');
    const ranks = await prisma.summonerRank.findMany({
        where: { queueType: 'RANKED_SOLO_5x5' },
        orderBy: { leaguePoints: 'desc' },
        take: 20,
        include: { summoner: true }
    });

    ranks.forEach((r, i) => {
        console.log(`${i + 1}. ${r.tier} ${r.rank} | ${r.leaguePoints} LP | Val: ${r.rankValue} | ${r.summoner.gameName}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
