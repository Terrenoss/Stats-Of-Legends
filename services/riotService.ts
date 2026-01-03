import { RiotGateway, Priority } from './RiotGateway';

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

const getHeaders = () => ({
  'X-Riot-Token': process.env.RIOT_API_KEY || ''
});

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

const fetchWithRetry = async (url: string, options: RequestInit = { headers: getHeaders() }) => {
  let retries = 0;
  while (retries < 3) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
      if (waitTime > 120000) {
        // Propagate very long waits ( > 2 mins) to caller
        const error: any = new Error('Rate Limit Exceeded');
        error.status = 429;
        error.retryAfter = waitTime;
        throw error;
      }
      if (!process.env.SUPPRESS_RIOT_LOGS) {
        console.log(`[RiotService] Rate limit hit. Waiting ${waitTime / 1000}s...`);
      }
      await wait(waitTime);
      retries++;
      continue;
    }
    return res;
  }
  return fetch(url, options);
};

export async function riotFetchRaw(url: string, priority: Priority = 'BACKGROUND') {
  return RiotGateway.execute(async () => {
    const res = await fetchWithRetry(url);
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  }, priority);
}

// --- Original Methods (Re-implemented) ---

export async function fetchRiotAccount(gameName: string, tagLine: string, regionRouting: string, priority: Priority = 'BACKGROUND') {
  return RiotGateway.execute(async () => {
    const url = `https://${regionRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`RIOT_${res.status}`);
    return res.json();
  }, priority);
}

export async function fetchSummonerByPuuid(puuid: string, platform: string, priority: Priority = 'BACKGROUND') {
  return RiotGateway.execute(async () => {
    const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`RIOT_${res.status}`);
    return res.json();
  }, priority);
}

export async function fetchMatchIds(puuid: string, regionRouting: string, start: number = 0, count: number = 20, priority: Priority = 'BACKGROUND') {
  return RiotGateway.execute(async () => {
    const url = `https://${regionRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`RIOT_${res.status}`);
    return res.json();
  }, priority);
}

export async function fetchMatchTimeline(matchId: string, regionRouting: string, priority: Priority = 'BACKGROUND') {
  const url = `https://${regionRouting}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetchRaw(url, priority);
}

export async function fetchLeagueEntriesByPuuid(puuid: string, platform: string, priority: Priority = 'BACKGROUND') {
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetchRaw(url, priority);
}

export async function fetchAccountByPuuid(puuid: string, regionRouting: string, priority: Priority = 'BACKGROUND') {
  return RiotGateway.execute(async () => {
    const url = `https://${regionRouting}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`RIOT_${res.status}`);
    return res.json();
  }, priority);
}


// --- New Scanner Methods (Object-based) ---

export const RiotService = {
  mapWithConcurrency,
  fetchAccountByPuuid,
  fetchSummonerByPuuid,


  getChampionIdMap: async (version: string) => {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    const riotData = await res.json();
    const map: Record<number, string> = {};
    Object.values(riotData.data).forEach((c: any) => {
      map[parseInt(c.key)] = c.id;
    });
    return map;
  },

  getItemMap: async (version: string) => {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`);
    const riotData = await res.json();
    return riotData.data; // Returns map of ID -> ItemData (including 'into' array)
  },

  getChallengerLeague: async (platform: string = 'euw1', queue: string = 'RANKED_SOLO_5x5', priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch challenger league: ${res.status}`);
      return res.json();
    }, priority);
  },

  getGrandmasterLeague: async (platform: string = 'euw1', queue: string = 'RANKED_SOLO_5x5', priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/${queue}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch grandmaster league: ${res.status}`);
      return res.json();
    }, priority);
  },

  getMasterLeague: async (platform: string = 'euw1', queue: string = 'RANKED_SOLO_5x5', priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${platform}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/${queue}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch master league: ${res.status}`);
      return res.json();
    }, priority);
  },

  getLeagueEntries: async (platform: string, queue: string, tier: string, division: string, page: number = 1, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/${queue}/${tier}/${division}?page=${page}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch league entries: ${res.status}`);
      return res.json();
    }, priority);
  },

  fetchSummonerById: async (platform: string, summonerId: string, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch summoner: ${res.status}`);
      return res.json();
    }, priority);
  },

  getMatches: async (region: string, puuid: string, count: number = 20, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch matches: ${res.status}`);
      return res.json();
    }, priority);
  },

  getMatchDetails: async (region: string, matchId: string, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch match details: ${res.status}`);
      return res.json();
    }, priority);
  },

  getPuuidByName: async (region: string, gameName: string, tagLine: string, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch account: ${res.status}`);
      return res.json();
    }, priority);
  },

  getMatchTimeline: async (region: string, matchId: string, priority: Priority = 'BACKGROUND') => {
    return RiotGateway.execute(async () => {
      const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`Failed to fetch match timeline: ${res.status}`);
      return res.json();
    }, priority);
  }
};
