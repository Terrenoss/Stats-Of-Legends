
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // In a real app, we would query the Riot Spectator V5 API here
  // const { searchParams } = new URL(request.url);
  // const encryptedSummonerId = searchParams.get('id');
  
  // Mock Data for Live Game
  const mockLiveGame = {
    gameId: 1234567890,
    gameStartTime: Date.now() - 1000 * 60 * 12, // Started 12 mins ago
    gameMode: "CLASSIC",
    mapId: 11,
    gameType: "MATCHED_GAME",
    bannedChampions: [
        { championId: 157, teamId: 100, pickTurn: 1 }, // Yasuo
        { championId: 238, teamId: 100, pickTurn: 2 }, // Zed
        { championId: 11, teamId: 100, pickTurn: 3 },  // Yi
        { championId: 84, teamId: 200, pickTurn: 4 },  // Akali
        { championId: 122, teamId: 200, pickTurn: 5 }, // Darius
    ],
    participants: [
        { teamId: 100, championId: 103, summonerName: "Faker", spell1Id: 4, spell2Id: 14, profileIconId: 1, rank: "CHALLENGER" },
        { teamId: 100, championId: 64, summonerName: "Oner", spell1Id: 11, spell2Id: 4, profileIconId: 2, rank: "CHALLENGER" },
        { teamId: 100, championId: 23, summonerName: "Zeus", spell1Id: 12, spell2Id: 4, profileIconId: 3, rank: "CHALLENGER" },
        { teamId: 100, championId: 222, summonerName: "Gumayusi", spell1Id: 4, spell2Id: 7, profileIconId: 4, rank: "CHALLENGER" },
        { teamId: 100, championId: 89, summonerName: "Keria", spell1Id: 4, spell2Id: 14, profileIconId: 5, rank: "CHALLENGER" },
        // Red Team
        { teamId: 200, championId: 61, summonerName: "Chovy", spell1Id: 4, spell2Id: 12, profileIconId: 6, rank: "CHALLENGER" },
        { teamId: 200, championId: 59, summonerName: "Canyon", spell1Id: 11, spell2Id: 4, profileIconId: 7, rank: "CHALLENGER" },
        { teamId: 200, championId: 58, summonerName: "Kiin", spell1Id: 12, spell2Id: 4, profileIconId: 8, rank: "CHALLENGER" },
        { teamId: 200, championId: 81, summonerName: "Peyz", spell1Id: 4, spell2Id: 7, profileIconId: 9, rank: "CHALLENGER" },
        { teamId: 200, championId: 497, summonerName: "Lehends", spell1Id: 4, spell2Id: 14, profileIconId: 10, rank: "CHALLENGER" },
    ]
  };

  return NextResponse.json(mockLiveGame);
}
