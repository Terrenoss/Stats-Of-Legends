import { CURRENT_PATCH } from '../constants';

/**
 * Helper to strip .png extension if present
 */
const cleanId = (id: string | number): string => {
    return String(id).replace(/\.png$/, '');
};

const CHAMPION_ID_MAP: Record<string, string> = {
    'FiddleSticks': 'Fiddlesticks',
    'Wukong': 'MonkeyKing',
    'Renata Glasc': 'Renata',
    'Bel\'Veth': 'Belveth',
    'Kog\'Maw': 'KogMaw',
    'Cho\'Gath': 'Chogath',
    'Kai\'Sa': 'Kaisa',
    'Vel\'Koz': 'Velkoz',
    'Kha\'Zix': 'Khazix',
    'LeBlanc': 'Leblanc',
    'Nunu & Willump': 'Nunu',
    'Dr. Mundo': 'DrMundo',
    'Jarvan IV': 'JarvanIV',
    'Lee Sin': 'LeeSin',
    'Master Yi': 'MasterYi',
    'Miss Fortune': 'MissFortune',
    'Tahm Kench': 'TahmKench',
    'Twisted Fate': 'TwistedFate',
    'Xin Zhao': 'XinZhao',
    'Aurelion Sol': 'AurelionSol',
    'Rek\'Sai': 'RekSai'
};

const normalizeChampionId = (id: string | number): string => {
    const strId = String(id);
    // Remove .png if present
    const clean = strId.replace(/\.png$/, '');
    // Check map
    if (CHAMPION_ID_MAP[clean]) return CHAMPION_ID_MAP[clean];
    // Check map for case-insensitive match if needed, but usually exact match is fine if we cover common cases.
    // If it's a name with spaces, remove spaces?
    // Most DDragon IDs are just Name with no spaces/apostrophes.
    // Let's try a generic fallback: remove spaces and apostrophes.
    // But preserve casing? DDragon is usually PascalCase.
    // e.g. "Lee Sin" -> "LeeSin".
    return clean;
};

/**
 * Generates the DDragon CDN URL for a champion's square icon.
 * @param championId The champion's ID or Name (e.g., "Aatrox" or "266" if key). 
 */
export const getChampionIconUrl = (championId: string | number, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${normalizeChampionId(championId)}.png`;
};

/**
 * Generates the DDragon CDN URL for an item icon.
 * @param itemId The item's numeric ID or filename.
 */
export const getItemIconUrl = (itemId: number | string, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${cleanId(itemId)}.png`;
};

/**
 * Generates the DDragon CDN URL for a profile icon.
 * @param iconId The profile icon ID.
 */
export const getProfileIconUrl = (iconId: number, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
};

/**
 * Generates the DDragon CDN URL for a spell icon.
 * @param spellId The spell ID or filename (e.g. "SummonerFlash").
 */
export const getSpellIconUrl = (spellId: string | number, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${cleanId(spellId)}.png`;
};

/**
 * Generates the DDragon CDN URL for a rune icon.
 * Note: Runes are usually in a different path and often don't use the versioned CDN for the image path itself in some contexts,
 * but DDragon docs say `https://ddragon.leagueoflegends.com/cdn/img/perk-images/...`
 * @param iconPath The relative path to the icon (e.g. "perk-images/Styles/7201_Precision.png").
 */
export const getRuneIconUrl = (iconPath: string): string => {
    return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`;
};

/**
 * Generates the DDragon CDN URL for a passive icon.
 * @param passiveId The passive filename (e.g. "Anivia_P").
 */
export const getPassiveIconUrl = (passiveId: string, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${cleanId(passiveId)}.png`;
};

const SPELL_MAP: Record<number, string> = {
    1: "SummonerBoost",
    3: "SummonerExhaust",
    4: "SummonerFlash",
    6: "SummonerHaste",
    7: "SummonerHeal",
    11: "SummonerSmite",
    12: "SummonerTeleport",
    13: "SummonerMana",
    14: "SummonerDot",
    21: "SummonerBarrier",
    30: "SummonerPoroRecall",
    31: "SummonerPoroThrow",
    32: "SummonerSnowball",
    39: "SummonerSnowURFSnowball_Mark",
    2201: "SummonerCherryHold",
    2202: "SummonerCherryFlash",
};

export const getSpellName = (spellId: number): string => {
    return SPELL_MAP[spellId] || `Summoner${spellId}`;
};
