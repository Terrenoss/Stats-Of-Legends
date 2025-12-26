import { GameMode } from '../../types';
import { MOCK_CHAMPION, MOCK_CHAMPIONS } from './champions';

export const MOCK_MATCHES: import('../../types').Match[] = [
    {
        id: "EUW1_1234567890",
        gameMode: GameMode.SOLO_DUO,
        gameCreation: Date.now(),
        gameDuration: 1800,
        queueId: 420,
        participants: [],
        teams: [],
        me: {
            summonerName: "Faker",
            champion: MOCK_CHAMPION,
            teamId: 100,
            kills: 10,
            deaths: 2,
            assists: 8,
            cs: 200,
            win: true,
            items: [],
            spells: [],
            visionScore: 25,
            totalDamageDealtToChampions: 25000,
            physicalDamageDealtToChampions: 5000,
            magicDamageDealtToChampions: 20000,
            totalMinionsKilled: 200,
            champLevel: 18,
            item0: 1, item1: 2, item2: 3, item3: 4, item4: 5, item5: 6, item6: 7,
        } as any
    },
    {
        id: "EUW1_1234567891",
        gameMode: GameMode.SOLO_DUO,
        gameCreation: Date.now() - 86400000,
        gameDuration: 2100,
        queueId: 420,
        participants: [],
        teams: [],
        me: {
            summonerName: "Faker",
            champion: MOCK_CHAMPIONS[1],
            teamId: 100,
            kills: 5,
            deaths: 8,
            assists: 4,
            cs: 180,
            win: false,
            items: [],
            spells: [],
            visionScore: 15,
            totalDamageDealtToChampions: 15000,
            physicalDamageDealtToChampions: 3000,
            magicDamageDealtToChampions: 12000,
            totalMinionsKilled: 180,
            champLevel: 16,
            item0: 1, item1: 2, item2: 3, item3: 4, item4: 5, item5: 6, item6: 7,
        } as any
    }
];
