import { CURRENT_PATCH } from '../constants';
import type { RiotAccount, RiotSummoner, RiotMatch } from '../types';

const RIOT_KEY = process.env.RIOT_API_KEY;

if (!RIOT_KEY) {
  console.warn('RIOT_API_KEY is not configured');
}

export type RiotErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'UNKNOWN';

export interface RiotErrorInfo {
  code: RiotErrorCode;
  status: number;
  body?: string;
  url: string;
}

export const PLATFORM_MAP: Record<string, string> = {
  EUW: 'euw1',
  EUNE: 'eun1',
  NA: 'na1',
  KR: 'kr',
  BR: 'br1',
  LAN: 'la1',
};

export const REGION_ROUTING: Record<string, string> = {
  EUW: 'europe',
  EUNE: 'europe',
  NA: 'americas',
  BR: 'americas',
  LAN: 'americas',
  KR: 'asia',
};

function mapStatusToError(status: number): RiotErrorCode {
  if (status === 404) return 'NOT_FOUND';
  if (status === 403) return 'FORBIDDEN';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'UNAVAILABLE';
  return 'UNKNOWN';
}

async function riotFetchJson<T>(url: string, revalidateSeconds = 60): Promise<T> {
  if (!RIOT_KEY) {
    throw new Error('RIOT_API_KEY is not configured');
  }

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_KEY },
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const code = mapStatusToError(res.status);
    throw Object.assign(new Error(`RIOT_${res.status}: ${body}`), {
      riotInfo: {
        code,
        status: res.status,
        body,
        url,
      } as RiotErrorInfo,
    });
  }

  return res.json() as Promise<T>;
}

export async function fetchRiotAccount(gameName: string, tagLine: string, routing: string): Promise<RiotAccount> {
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName,
  )}/${encodeURIComponent(tagLine)}`;
  return riotFetchJson<RiotAccount>(url, 60);
}

export async function fetchSummonerByPuuid(puuid: string, platform: string): Promise<RiotSummoner> {
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
  return riotFetchJson<RiotSummoner>(url, 60);
}

export async function fetchMatchIds(puuid: string, routing: string, start = 0, count = 10): Promise<string[]> {
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
    puuid,
  )}/ids?start=${start}&count=${count}`;
  return riotFetchJson<string[]>(url, 60);
}

export async function fetchMatchDetail(matchId: string, routing: string): Promise<RiotMatch> {
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  return riotFetchJson<RiotMatch>(url, 60);
}

export async function fetchMatchTimeline(matchId: string, routing: string): Promise<any> {
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetchJson<any>(url, 60);
}

// Petit helper pour limiter la concurrence (reprend l\'idée de pMapLimit)
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let index = 0;
  let active = 0;

  return new Promise((resolve) => {
    const next = () => {
      if (index >= items.length && active === 0) {
        return resolve(results);
      }

      while (active < limit && index < items.length) {
        const currentIndex = index++;
        active++;
        fn(items[currentIndex])
          .then((res) => {
            results[currentIndex] = res;
          })
          .catch(() => {
            results[currentIndex] = null;
          })
          .finally(() => {
            active--;
            next();
          });
      }
    };

    next();
  });
}

export async function riotFetchRaw(url: string, revalidateSeconds = 60) {
  if (!RIOT_KEY) {
    throw new Error('RIOT_API_KEY is not configured');
  }

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_KEY },
    next: { revalidate: revalidateSeconds },
  });

  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body, url };
}
