
import { prisma } from '@/lib/prisma';
import { MatchHistoryService } from '@/services/MatchHistoryService';
import { RiotMatch } from '@/types';
import { CURRENT_PATCH } from '@/constants';

async function main() {
    console.log('Starting Legend Score Backfill...');

    // 1. Get all SummonerMatches with score 0
    const matchesToUpdate = await prisma.summonerMatch.findMany({
        where: { legendScore: 0 },
        include: { match: true }
    });

    console.log(`Found ${matchesToUpdate.length} matches to update.`);

    let updatedCount = 0;
    const errors: any[] = [];

    for (const sm of matchesToUpdate) {
        try {
            const matchData = sm.match.jsonData as unknown as RiotMatch;
            const version = sm.match.gameVersion || CURRENT_PATCH;

            // Calculate Score
            const formatted = await MatchHistoryService.formatMatchData(matchData, sm.summonerPuuid, version, sm.match.averageRank);

            const me = formatted.participants.find((p: any) => p.puuid === sm.summonerPuuid);
            const score = me?.legendScore || 0;

            if (score > 0) {
                await prisma.summonerMatch.update({
                    where: { summonerPuuid_matchId: { summonerPuuid: sm.summonerPuuid, matchId: sm.matchId } },
                    data: { legendScore: score }
                });
                updatedCount++;
                if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} matches...`);
            }
        } catch (err) {
            errors.push({ id: sm.matchId, error: err });
        }
    }

    console.log(`Finished! Updated ${updatedCount} matches.`);
    if (errors.length > 0) {
        console.log(`${errors.length} errors occurred.`);
        console.log(errors[0]);
    }

    // 2. Update SummonerRanks
    console.log('Updating Summoner Ranks...');
    const summoners = await prisma.summoner.findMany({ select: { puuid: true } });

    for (const s of summoners) {
        const matches = await prisma.summonerMatch.findMany({
            where: { summonerPuuid: s.puuid, role: { not: 'UNKNOWN' } },
            select: { legendScore: true },
            take: 20,
            orderBy: { match: { gameCreation: 'desc' } }
        });

        if (matches.length > 0) {
            const totalScore = matches.reduce((sum, m) => sum + (m.legendScore || 0), 0);
            const avgScore = totalScore / matches.length;

            await prisma.summonerRank.updateMany({
                where: { summonerPuuid: s.puuid },
                data: { legendScore: avgScore }
            });
        }
    }
    console.log('Ranks updated.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
