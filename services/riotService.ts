const RIOT_API_KEY = process.env.RIOT_API_KEY;

export const PLATFORM_MAP: Record<string, string> = {
  EUW: 'euw1',
  NA: 'na1',
  KR: 'kr',
  EUNE: 'eun1',
  BR: 'br1',
  LAN: 'la1',
};

export const REGION_ROUTING: Record<string, string> = {
  EUW: 'europe',
  NA: 'americas',
  KR: 'asia',
  EUNE: 'europe',
  BR: 'americas',
  LAN: 'americas',
};

const headers = {
  'X-Riot-Token': RIOT_API_KEY || ''
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

const fetchWithRetry = async (url: string, options: RequestInit = { headers }) => {
  let retries = 0;
  while (retries < 3) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
      if (waitTime > 10000) {
        // Propagate long waits to caller
        const error: any = new Error('Rate Limit Exceeded');
        error.status = 429;
        error.retryAfter = waitTime;
        throw error;
      }
      await wait(waitTime);
      retries++;
      continue;
    }
    return res;
  }
  return fetch(url, options);
};

export async function riotFetchRaw(url: string) {
  const res = await fetchWithRetry(url);
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

// --- Original Methods (Re-implemented) ---

export async function fetchRiotAccount(gameName: string, tagLine: string, regionRouting: string) {
  const url = `https://${regionRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`RIOT_${res.status}`);
  return res.json();
}

export async function fetchSummonerByPuuid(puuid: string, platform: string) {
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`RIOT_${res.status}`);
  return res.json();
}

export async function fetchMatchIds(puuid: string, regionRouting: string, start: number = 0, count: number = 20) {
  const url = `https://${regionRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`RIOT_${res.status}`);
  return res.json();
}

export async function fetchMatchTimeline(matchId: string, regionRouting: string) {
  const url = `https://${regionRouting}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetchRaw(url);
}

export async function fetchLeagueEntriesByPuuid(puuid: string, platform: string) {
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetchRaw(url);
}


// --- New Scanner Methods (Object-based) ---

export const RiotService = {
  getVersions: async () => {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  getChampionIdMap: async (version: string) => {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    const data = await res.json();
    const map: Record<number, string> = {};
    Object.values(data.data).forEach((c: any) => {
      map[parseInt(c.key)] = c.id;
    });
    return map;
  },

  getItemMap: async (version: string) => {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
    const data = await res.json();
    return data.data; // Returns map of ID -> ItemData (including 'into' array)
  },

  getChallengerLeague: async (platform: string = 'euw1', queue: string = 'RANKED_SOLO_5x5') => {
    const url = `https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch challenger league: ${res.status}`);
    return res.json();
  },

  getLeagueEntries: async (platform: string, queue: string, tier: string, division: string, page: number = 1) => {
    const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=${page}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch league entries: ${res.status}`);
    return res.json();
  },

  fetchSummonerById: async (platform: string, summonerId: string) => {
    const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch summoner: ${res.status}`);
    return res.json();
  },

  getMatches: async (region: string, puuid: string, count: number = 20) => {
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`);
    return res.json();
  },

  getMatchDetails: async (region: string, matchId: string) => {
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch match details: ${res.status}`);
    return res.json();
  },

  getPuuidByName: async (region: string, gameName: string, tagLine: string) => {
    const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch account: ${res.status}`);
    return res.json();
  },

  getMatchTimeline: async (region: string, matchId: string) => {
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`Failed to fetch match timeline: ${res.status}`);
    return res.json();
  }
};
