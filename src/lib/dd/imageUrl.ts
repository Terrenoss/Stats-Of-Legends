export function championIconCandidates(imageFull: string, patch?: string) {
  const p = patch || 'latest';
  const cdn = `https://ddragon.leagueoflegends.com/cdn/${p}/img/champion/${imageFull}`;
  const local = `/data/${p}/img/champion-${imageFull}`; // because copy script prefixed with champion-
  return { cdn, local };
}

export function itemIconCandidates(imageFull: string, patch?: string) {
  const p = patch || 'latest';
  const cdn = `https://ddragon.leagueoflegends.com/cdn/${p}/img/item/${imageFull}`;
  const local = `/data/${p}/img/item-${imageFull}`;
  return { cdn, local };
}

export function championIconUrl(patch: string, imageFull: string) {
  const p = patch || 'latest';
  if (!imageFull) return `https://ddragon.leagueoflegends.com/cdn/${p}/img/champion/placeholder.png`;
  // prefer CDN by default; components can fallback to local onError
  const cdn = `https://ddragon.leagueoflegends.com/cdn/${p}/img/champion/${imageFull}`;
  return cdn;
}

export function itemIconUrl(patch: string, imageFullOrObj: any) {
  const p = patch || 'latest';
  if (!imageFullOrObj) return `https://ddragon.leagueoflegends.com/cdn/${p}/img/item/placeholder.png`;
  let imageFull = '';
  if (typeof imageFullOrObj === 'string') imageFull = imageFullOrObj;
  else if (imageFullOrObj && typeof imageFullOrObj === 'object') {
    imageFull = imageFullOrObj.full || imageFullOrObj.imageFull || imageFullOrObj.image || '';
  }
  if (!imageFull) return `https://ddragon.leagueoflegends.com/cdn/${p}/img/item/placeholder.png`;
  const cdn = `https://ddragon.leagueoflegends.com/cdn/${p}/img/item/${imageFull}`;
  return cdn;
}

export function runeIconUrl(relativePath: string) {
  // relativePath example: "perk-images/Styles/Domination/Electrocute/Electrocute.png"
  if (!relativePath) return '';
  return `https://ddragon.leagueoflegends.com/cdn/img/${relativePath}`;
}

export function statModIconUrl(fileName: string) {
  // CommunityDragon raw assets for statmods
  // Example filename: 'statmodsadaptiveforceicon.png'
  if (!fileName) return '';
  return `https://raw.communitydragon.org/latest/game/assets/perks/statmods/${fileName}`;
}
