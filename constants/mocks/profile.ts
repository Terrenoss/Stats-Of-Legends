import { SummonerProfile, Teammate, LPPoint, HeatmapDay, RoleStat } from '../../types';

export const MOCK_PROFILE: SummonerProfile = {
    name: "Faker",
    tag: "KR1",
    level: 684,
    profileIconId: 1,
    ranks: {
        solo: {
            tier: "CHALLENGER",
            rank: "I",
            lp: 1450,
            wins: 240,
            losses: 180
        },
        flex: {
            tier: "GRANDMASTER",
            rank: "I",
            lp: 620,
            wins: 80,
            losses: 45
        }
    },
    pastRanks: [
        { season: "S2024-1", tier: "CHALLENGER", rank: "I" },
        { season: "S2023", tier: "CHALLENGER", rank: "I" },
        { season: "S2022", tier: "GRANDMASTER", rank: "I" }
    ],
    ladderRank: 629753,
    topPercent: 16.52,
    lastUpdated: Date.now() - (4 * 24 * 60 * 60 * 1000), // 4 days ago
    metrics: {
        combat: 75,
        objectives: 60,
        vision: 45,
        farming: 80,
        survival: 70,
        consistencyBadge: 'Rock Solid'
    }
};

export const MOCK_TEAMMATES: Teammate[] = [
    { name: "Keria", tag: "T1", profileIconId: 2, games: 15, wins: 12, losses: 3, winrate: 80 },
    { name: "Zeus", tag: "T1", profileIconId: 3, games: 12, wins: 8, losses: 4, winrate: 66 },
    { name: "Oner", tag: "T1", profileIconId: 4, games: 10, wins: 5, losses: 5, winrate: 50 },
    { name: "Gumayusi", tag: "T1", profileIconId: 5, games: 8, wins: 6, losses: 2, winrate: 75 },
];

export const MOCK_LP_HISTORY: LPPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullDate: d.toLocaleDateString('fr-FR'),
        lp: 1400 + Math.floor(Math.sin(i * 0.5) * 50 + Math.random() * 30),
        tier: "CHALLENGER",
        rank: "I"
    };
});

export const MOCK_HEATMAP_DATA: HeatmapDay[] = Array.from({ length: 120 }, (_, i) => {
    const games = Math.floor(Math.random() * 8); // 0 to 7 games
    const wins = Math.floor(Math.random() * (games + 1));
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (games > 0) {
        const winrate = wins / games;
        if (winrate >= 0.6) intensity = 4; // Great
        else if (winrate >= 0.5) intensity = 3; // Good
        else if (winrate >= 0.4) intensity = 2; // Bad
        else intensity = 1; // Terrible
    }
    return {
        date: new Date(Date.now() - (119 - i) * 86400000).toISOString(),
        games,
        wins,
        losses: games - wins,
        intensity
    };
});

export const MOCK_ROLES: RoleStat[] = [
    { role: 'MID', games: 240, winrate: 58 },
    { role: 'TOP', games: 45, winrate: 48 },
    { role: 'JUNGLE', games: 12, winrate: 42 },
    { role: 'ADC', games: 8, winrate: 30 },
    { role: 'SUPPORT', games: 5, winrate: 50 },
];
