import { DetailedChampionStats, Champion, DummyStats } from '../../types';

export const MOCK_DETAILED_CHAMPIONS: DetailedChampionStats[] = [
    {
        id: 103,
        name: "Ahri",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png",
        games: 91,
        wins: 50,
        losses: 41,
        kda: 3.09,
        kills: 5.6,
        deaths: 4.7,
        assists: 9.0,
        dmgPerMinute: 821,
        dmgTakenPerMinute: 892,
        csPerMinute: 7.0,
        gd15: 57,
        csd15: 5.9,
        dmgPercentage: 22.1
    },
    {
        id: 517,
        name: "Sylas",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Sylas.png",
        games: 18,
        wins: 8,
        losses: 10,
        kda: 1.53,
        kills: 4.2,
        deaths: 6.8,
        assists: 6.2,
        dmgPerMinute: 711,
        dmgTakenPerMinute: 919,
        csPerMinute: 5.9,
        gd15: -224,
        csd15: -2.1,
        dmgPercentage: 19.3
    },
    {
        id: 61,
        name: "Orianna",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Orianna.png",
        games: 15,
        wins: 8,
        losses: 7,
        kda: 2.77,
        kills: 3.5,
        deaths: 3.2,
        assists: 8.8,
        dmgPerMinute: 780,
        dmgTakenPerMinute: 650,
        csPerMinute: 8.2,
        gd15: 120,
        csd15: 8.5,
        dmgPercentage: 24.5
    },
    {
        id: 711,
        name: "Vex",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Vex.png",
        games: 11,
        wins: 7,
        losses: 4,
        kda: 1.66,
        kills: 5.1,
        deaths: 6.0,
        assists: 4.8,
        dmgPerMinute: 890,
        dmgTakenPerMinute: 800,
        csPerMinute: 6.5,
        gd15: -50,
        csd15: -1.2,
        dmgPercentage: 26.0
    },
    {
        id: 3,
        name: "Galio",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Galio.png",
        games: 10,
        wins: 3,
        losses: 7,
        kda: 2.84,
        kills: 2.1,
        deaths: 3.5,
        assists: 10.2,
        dmgPerMinute: 550,
        dmgTakenPerMinute: 1100,
        csPerMinute: 5.2,
        gd15: -100,
        csd15: -5.0,
        dmgPercentage: 15.2
    },
    {
        id: 131,
        name: "Diana",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Diana.png",
        games: 9,
        wins: 4,
        losses: 5,
        kda: 2.04,
        kills: 6.2,
        deaths: 5.5,
        assists: 5.0,
        dmgPerMinute: 760,
        dmgTakenPerMinute: 790,
        csPerMinute: 7.1,
        gd15: 45,
        csd15: 2.2,
        dmgPercentage: 21.0
    }
];

export const MOCK_CHAMPIONS: Champion[] = [
    {
        id: 1,
        name: "Ahri",
        title: "The Nine-Tailed Fox",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png",
        baseStats: { hp: 590, hpRegen: 5.5, mp: 418, mpRegen: 8, ad: 53, ap: 0, armor: 21, mr: 30, haste: 0, crit: 0, moveSpeed: 330, attackSpeed: 0.668, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 96, hpRegen: 0.6, mp: 25, mpRegen: 0.8, ad: 3, armor: 4.7, mr: 1.3, attackSpeed: 2 }, // AS is % growth
        spells: [
            {
                id: 'Q',
                name: 'Orb of Deception',
                imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriQ.png',
                description: "Ahri envoie son orbe puis le rappelle, infligeant des dégâts magiques à l'aller et des dégâts bruts au retour.",
                maxRank: 5,
                cooldown: [7, 7, 7, 7, 7],
                cost: [55, 65, 75, 85, 95],
                baseDamage: [40, 65, 90, 115, 140], // Per pass (so x2 total potential)
                ratios: { ap: 0.45 }, // Per pass
                damageType: 'magic' // Simplified mix
            },
            {
                id: 'W',
                name: 'Fox-Fire',
                imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriW.png',
                description: "Ahri libère 3 feux de renard qui verrouillent les ennemis proches.",
                maxRank: 5,
                cooldown: [9, 8, 7, 6, 5],
                cost: [30, 30, 30, 30, 30],
                baseDamage: [50, 75, 100, 125, 150],
                ratios: { ap: 0.30 },
                damageType: 'magic'
            },
            {
                id: 'E',
                name: 'Charm',
                imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriE.png',
                description: "Ahri envoie un baiser qui inflige des dégâts et charme le premier ennemi touché.",
                maxRank: 5,
                cooldown: [14, 12, 12, 12, 12],
                cost: [80, 80, 80, 80, 80],
                baseDamage: [80, 110, 140, 170, 200],
                ratios: { ap: 0.60 },
                damageType: 'magic'
            },
            {
                id: 'R',
                name: 'Spirit Rush',
                imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriR.png',
                description: "Ahri se rue vers l'avant et tire des éclairs d'essence (3 charges).",
                maxRank: 3,
                cooldown: [130, 105, 80],
                cost: [100, 100, 100],
                baseDamage: [60, 90, 120], // Per bolt
                ratios: { ap: 0.35 },
                damageType: 'magic'
            }
        ]
    },
    {
        id: 2,
        name: "Darius",
        title: "Hand of Noxus",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Darius.png",
        baseStats: { hp: 652, hpRegen: 10, mp: 263, mpRegen: 6.6, ad: 64, ap: 0, armor: 39, mr: 32, haste: 0, crit: 0, moveSpeed: 340, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 114, hpRegen: 0.9, mp: 57.5, mpRegen: 0.35, ad: 5, armor: 5.2, mr: 2.05, attackSpeed: 1 }
    },
    {
        id: 3,
        name: "Jinx",
        title: "The Loose Cannon",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Jinx.png",
        baseStats: { hp: 630, hpRegen: 3.75, mp: 260, mpRegen: 6.7, ad: 59, ap: 0, armor: 26, mr: 30, haste: 0, crit: 0, moveSpeed: 325, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 105, hpRegen: 0.5, mp: 50, mpRegen: 1, ad: 3.15, armor: 4.2, mr: 1.3, attackSpeed: 1 }
    },
    {
        id: 4,
        name: "Leona",
        title: "The Radiant Dawn",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Leona.png",
        baseStats: { hp: 646, hpRegen: 8.5, mp: 302, mpRegen: 6, ad: 60, ap: 0, armor: 47, mr: 32, haste: 0, crit: 0, moveSpeed: 335, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 112, hpRegen: 0.85, mp: 40, mpRegen: 0.8, ad: 3, armor: 4.8, mr: 2.05, attackSpeed: 2.9 }
    },
    {
        id: 5,
        name: "Zed",
        title: "The Master of Shadows",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Zed.png",
        baseStats: { hp: 654, hpRegen: 7, mp: 200, mpRegen: 50, ad: 63, ap: 0, armor: 32, mr: 32, haste: 0, crit: 0, moveSpeed: 345, attackSpeed: 0.651, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 99, hpRegen: 0.65, mp: 0, mpRegen: 0, ad: 3.4, armor: 4.7, mr: 2.05, attackSpeed: 3.3 }
    },
    {
        id: 6,
        name: "Lux",
        title: "The Lady of Luminosity",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Lux.png",
        baseStats: { hp: 580, hpRegen: 5.5, mp: 480, mpRegen: 8, ad: 54, ap: 0, armor: 21, mr: 30, haste: 0, crit: 0, moveSpeed: 330, attackSpeed: 0.669, magicPen: 0, lethality: 0 },
        statsGrowth: { hp: 99, hpRegen: 0.55, mp: 25, mpRegen: 0.8, ad: 3.3, armor: 4, mr: 1.3, attackSpeed: 1.36 }
    }
];

export const MOCK_CHAMPION = MOCK_CHAMPIONS[0];

export const DEFAULT_DUMMY: DummyStats = {
    hp: 2000,
    armor: 70,
    mr: 70
};
