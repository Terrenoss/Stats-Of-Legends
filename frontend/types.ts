export enum GameMode {
  SOLO_DUO = 'Ranked Solo/Duo',
  FLEX = 'Ranked Flex',
  ARAM = 'ARAM',
  NORMAL = 'Normal'
}

export enum Side {
  BLUE = 'Blue',
  RED = 'Red'
}

export type Language = 'FR' | 'EN' | 'ES' | 'KR';
export type Region = 'EUW' | 'NA' | 'KR' | 'EUNE' | 'BR' | 'LAN';

export interface Stats {
  hp: number;
  mp: number; // Mana
  mpRegen: number; // Mana Regen
  ad: number;
  ap: number;
  armor: number;
  mr: number;
  attackSpeed: number; // AS
  haste: number;
  crit: number;
  moveSpeed: number;
  lethality?: number;
  magicPen?: number;
  percentPen?: number;
}

export interface StatsGrowth {
  hp: number;
  mp: number;
  mpRegen: number;
  ad: number;
  armor: number;
  mr: number;
  attackSpeed: number;
}

export interface Spell {
  id: string; // Q, W, E, R
  name: string;
  imageUrl: string;
  description: string;
  maxRank: number;
  cooldown: number[];
  cost: number[];
  baseDamage: number[]; 
  ratios: {
    ad?: number; 
    ap?: number; 
  };
  damageType: 'physical' | 'magic' | 'true';
}

export interface Champion {
  id: number;
  name: string;
  imageUrl: string;
  title?: string;
  baseStats?: Stats;
  statsGrowth?: StatsGrowth;
  spells?: Spell[];
}

export interface SummonerSpell {
  id: number;
  name: string;
  imageUrl: string;
}

export interface Item {
  id: number;
  name: string;
  imageUrl: string;
  price?: number;
  stats?: Partial<Stats>; 
  description?: string;
  passive?: string;
}

// New Interface for Timed Items (Build Tab)
export interface ItemTimestamp {
  item: Item;
  timestamp: string; // e.g. "12m"
}

export interface Participant {
  summonerName: string;
  tagLine?: string;
  champion: Champion;
  teamId: 100 | 200; // 100 Blue, 200 Red
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  win: boolean;
  items: Item[];
  spells: SummonerSpell[];
  visionScore: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  level: number;
  rank?: string; // e.g., "P4"
  opScore?: number; // 0-100 score
}

// New Interface for Match Timeline Graph
export interface MatchTimelinePoint {
  timestamp: string; // "5m", "10m"
  blueScore: number; // AI Score or Gold Advantage representation
  redScore: number;
  event?: string; // "Dragon", "Baron"
}

export interface Match {
  id: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: GameMode;
  participants: Participant[];
  me: Participant; // Shortcut to the main user's data within participants
  timelineData?: MatchTimelinePoint[];
  itemBuild?: ItemTimestamp[];
}

export interface RankDetail {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface PastRank {
  season: string; // e.g., "S2024-1"
  tier: string;
  rank: string; // "IV"
}

export interface SummonerProfile {
  name: string;
  tag: string;
  level: number;
  profileIconId: number;
  ranks: {
    solo: RankDetail;
    flex: RankDetail;
  };
  pastRanks: PastRank[];
  ladderRank: number; // Position in ladder
  topPercent: number; // Top % of players
  lastUpdated: number; // Timestamp
}

export interface Teammate {
  name: string;
  tag: string;
  profileIconId: number;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface AnalysisResult {
  markdown: string;
}

export interface DummyStats {
  hp: number;
  armor: number;
  mr: number;
}

// New Types for Advanced Stats
export interface PerformanceMetrics {
  gpm: number;
  csm: number;
  dpm: number;
  dmgPercentage: number;
  kda: number;
  xpd15: number; // XP Diff @ 15
  csd15: number; // CS Diff @ 15
  gd15: number;  // Gold Diff @ 15
}

export interface HeatmapDay {
  date: string;
  games: number;
  wins: number;
  losses: number;
  intensity: 0 | 1 | 2 | 3 | 4; // 0=none, 1-2=bad/low, 3-4=good/high
}

export interface LPPoint {
  date: string;
  lp: number;
  tier?: string;
  rank?: string;
  fullDate?: string;
}

export interface DetailedChampionStats {
  id: number;
  name: string;
  imageUrl: string;
  games: number;
  wins: number;
  losses: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  dmgPerMinute: number;
  dmgTakenPerMinute: number;
  csPerMinute: number;
  gd15: number;
  csd15: number;
  dmgPercentage: number;
}

export interface RoleStat {
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  games: number;
  winrate: number;
}

export interface SeasonInfo {
  season: string;
  split: string;
}
