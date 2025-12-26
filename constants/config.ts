import { SeasonInfo, Region } from '../types';

export const CURRENT_PATCH = "15.24.1";

export const CURRENT_SEASON_INFO: SeasonInfo = {
    season: 'Season 2025',
    split: 'Split 2',
};

export const REGIONS: Region[] = ['EUW', 'NA', 'KR', 'EUNE', 'BR', 'LAN'];

export const RANK_EMBLEMS: Record<string, string> = {
    "UNRANKED": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/unranked.png",
    "IRON": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/iron.png",
    "BRONZE": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/bronze.png",
    "SILVER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/silver.png",
    "GOLD": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/gold.png",
    "PLATINUM": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/platinum.png",
    "EMERALD": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/emerald.png",
    "DIAMOND": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/diamond.png",
    "MASTER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/master.png",
    "GRANDMASTER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/grandmaster.png",
    "CHALLENGER": "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/challenger.png"
};

// Placeholder images
export const PLACEHOLDER_CHAMP = "https://picsum.photos/64/64";
export const PLACEHOLDER_ITEM = "https://picsum.photos/32/32";
export const PLACEHOLDER_SPELL = "https://picsum.photos/32/32";
