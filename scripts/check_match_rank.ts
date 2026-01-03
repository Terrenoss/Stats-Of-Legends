
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const match = await prisma.match.findFirst({
        orderBy: { gameCreation: 'desc' },
        include: {
            participants: true
        }
    });

    if (!match) {
        console.log("No match found.");
        return;
    }

    console.log(`Match ID: ${match.id}`);
    console.log(`Average Rank: ${match.averageRank}`);

    if (match.participants) {
        console.log(`Participants count: ${match.participants.length}`);
        // rank is not directly on SummonerMatch
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
