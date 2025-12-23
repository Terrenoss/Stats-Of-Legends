import { CURRENT_PATCH } from '../constants';

/**
 * Generates the DDragon CDN URL for a champion's square icon.
 * @param championId The champion's ID or Name (e.g., "Aatrox" or "266" if key). 
 *                   Note: DDragon usually expects the *Name* (e.g. "Aatrox.png"), not the numeric ID.
 *                   However, for some APIs, we might have the numeric ID. 
 *                   Ideally, we should pass the "id" string from DDragon data (e.g. "MonkeyKing").
 * @param version Optional version. Defaults to CURRENT_PATCH.
 */
export const getChampionIconUrl = (championId: string | number, version: string = CURRENT_PATCH): string => {
    // If it's a numeric ID, we might have a problem if we don't have the map. 
    // But in our app, 'championId' in ChampionTier is usually the string ID (e.g. "Aatrox").
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
};

/**
 * Generates the DDragon CDN URL for an item icon.
 * @param itemId The item's numeric ID.
 * @param version Optional version. Defaults to CURRENT_PATCH.
 */
export const getItemIconUrl = (itemId: number, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
};

/**
 * Generates the DDragon CDN URL for a profile icon.
 * @param iconId The profile icon ID.
 * @param version Optional version. Defaults to CURRENT_PATCH.
 */
export const getProfileIconUrl = (iconId: number, version: string = CURRENT_PATCH): string => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
};
