import { Item } from '../types';

export const BUILDER_ITEMS: Item[] = [
    {
        id: 1,
        name: "Luden's Companion",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3285.png",
        price: 3000,
        stats: { ap: 90, haste: 20, mp: 600, mr: 0, armor: 0, hp: 0, ad: 0, crit: 0, moveSpeed: 0, magicPen: 0 },
        description: "Confère de la puissance de burst et du mana.",
        passive: "Charge : Gagnez une charge de tir toutes les 3s. Les sorts consomment les charges pour infliger 40 (+8% AP) dégâts magiques bonus.",
        tags: ['Legendary', 'Mythic']
    },
    {
        id: 2,
        name: "Rabadon's Deathcap",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3089.png",
        price: 3600,
        stats: { ap: 140, haste: 0, mr: 0, armor: 0, hp: 0, ad: 0, crit: 0, moveSpeed: 0 },
        description: "L'item ultime pour les mages.",
        passive: "Magical Opus : Augmente votre Puissance (AP) totale de 35%.",
        tags: ['Legendary']
    },
    {
        id: 3,
        name: "Shadowflame",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/4645.png",
        price: 3200,
        stats: { ap: 120, haste: 0, mr: 0, armor: 0, hp: 0, ad: 0, crit: 0, moveSpeed: 0, magicPen: 12 },
        description: "Critiques magiques sur cibles fragiles.",
        passive: "Cinderbloom : Les dégâts magiques et bruts infligent des coups critiques aux ennemis ayant moins de 35% de PV (bonus 20%).",
        tags: ['Legendary']
    },
    {
        id: 4,
        name: "Infinity Edge",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3031.png",
        price: 3300,
        stats: { ad: 65, crit: 20, haste: 0, mr: 0, armor: 0, hp: 0, ap: 0, moveSpeed: 0 },
        description: "Augmente massivement les dégâts critiques.",
        passive: "Critical Precision : Vos coups critiques infligent 40% de dégâts supplémentaires.",
        tags: ['Legendary', 'Mythic']
    },
    {
        id: 5,
        name: "Trinity Force",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3078.png",
        price: 3333,
        stats: { ad: 45, hp: 300, haste: 20, moveSpeed: 20, attackSpeed: 33, crit: 0, mr: 0, armor: 0, ap: 0 },
        description: "L'item polyvalent par excellence.",
        passive: "Spellblade : Après une compétence, votre prochaine attaque inflige 200% AD de base bonus.",
        tags: ['Legendary', 'Mythic']
    },
    {
        id: 6,
        name: "Zhonya's Hourglass",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3157.png",
        price: 3250,
        stats: { ap: 120, armor: 50, haste: 15, mr: 0, hp: 0, ad: 0, crit: 0, moveSpeed: 0 },
        description: "Protection contre le burst.",
        passive: "Stasis (Actif) : Vous devenez invulnérable et inciblable pendant 2.5s.",
        tags: ['Legendary']
    },
    {
        id: 7,
        name: "Kraken Slayer",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/6672.png",
        price: 3000,
        stats: { ad: 40, haste: 0, moveSpeed: 5, crit: 20, attackSpeed: 35, mr: 0, armor: 0, hp: 0, ap: 0 },
        description: "Anti-Tank via vitesse d'attaque.",
        passive: "Bring It Down : Chaque 3ème attaque inflige des dégâts physiques bonus à l'impact.",
        tags: ['Legendary', 'Mythic']
    },
    {
        id: 8,
        name: "Heartsteel",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3084.png",
        price: 3000,
        stats: { hp: 800, haste: 0, hpRegen: 200, mr: 0, armor: 0, ad: 0, ap: 0, crit: 0, moveSpeed: 0 },
        description: "PV infinis pour les tanks.",
        passive: "Colossal Consumption : Charge une attaque puissante contre les champions qui augmente vos PV max de façon permanente.",
        tags: ['Legendary', 'Mythic']
    },
    {
        id: 9,
        name: "Blade of the Ruined King",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3153.png",
        price: 3200,
        stats: { ad: 40, attackSpeed: 25, lifesteal: 8, haste: 0, mr: 0, armor: 0, hp: 0, ap: 0, crit: 0, moveSpeed: 0 },
        description: "Dégâts basés sur les PV actuels.",
        passive: "Mist's Edge : Les attaques infligent des dégâts physiques supplémentaires égaux à 12% (mêlée) / 9% (distance) des PV actuels de la cible.",
        tags: ['Legendary']
    },
    {
        id: 10,
        name: "Jak'Sho, The Protean",
        imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/6665.png",
        price: 3200,
        stats: { hp: 300, armor: 50, mr: 50, haste: 0, ad: 0, ap: 0, crit: 0, moveSpeed: 0 },
        description: "Tankiness croissante en combat.",
        passive: "Voidborn Resilience : En combat contre des champions, gagnez des résistances bonus cumulables.",
        tags: ['Legendary', 'Mythic']
    }
];
