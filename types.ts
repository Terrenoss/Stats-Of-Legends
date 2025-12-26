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

export type ItemTag = 'Mythic' | 'Legendary' | 'Boots' | 'Starter' | 'Component';

export interface Rune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface RuneSlot {
  runes: Rune[];
}

export interface RuneStyle {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RuneSlot[];
}

export interface SelectedRunes {
  primaryStyleId: number | null;
  subStyleId: number | null;
  selectedPerkIds: (number | null)[]; // [primary1, primary2, primary3, primary4, sub1, sub2, shard1, shard2, shard3]
}

export interface Item {
  id: number;
  name: string;
  imageUrl: string;
  price?: number;
  stats?: Partial<Stats>;
  description?: string;
  passive?: string;
  tags?: ItemTag[];
}

// New Interface for Timed Items (Build Tab)
export interface ItemTimestamp {
  item: Item;
  timestamp: string; // e.g. "12m"
  action?: string; // optional: 'ITEM_PURCHASED' | 'ITEM_SOLD' | 'ITEM_UNDO'
}

export interface ParticipantRunes {
  primary: string | null;
  secondary: string | null;
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
  physicalDamageDealtToChampions: number;
  magicDamageDealtToChampions: number;
  trueDamageDealtToChampions?: number;
  ace?: boolean; // indicates ACE (all enemies killed) if present in source
  aceCount?: number; // number of ace occurrences (optional)
  puuid?: string; // player's unique id from Riot
  participantId?: number; // numeric participant id within match frames

  // New fields for detailed tabs
  runes?: ParticipantRunes;
  pentaKills?: number;
  quadraKills?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  teamPosition?: string;
  wardsPlaced?: number;
  wardsKilled?: number;
  visionWardsBoughtInGame?: number;
  killParticipation?: number;
  challenges?: {
    dragonTakedowns?: number;
    baronTakedowns?: number;
    turretTakedowns?: number;
    inhibitorTakedowns?: number;
    [key: string]: any;
  };
  goldEarned?: number;
  timeCCingOthers?: number;
  totalHeal?: number;
  totalHealsOnTeammates?: number;
  totalDamageShieldedOnTeammates?: number;
  totalDamageTaken?: number;
  level?: number;
  rank?: string;
  opScore?: number;
  champLevel?: number;

  // Legend Score V2/V3
  legendScore?: number;
  legendScoreGrade?: string;
  legendScoreBreakdown?: {
    kda: number;
    damage: number;
    gold: number;
    vision: number;
    cs: number;
    objective: number;
    utility: number;
    lane?: number;
  };
  legendScoreComparison?: string;
  legendScoreContribution?: number;
  legendScoreSampleSize?: number;
  roleAveragePerformance?: {
    kda: number;
    damage: number;
    gold: number;
    vision: number;
    cs: number;
    objective: number;
    utility: number;
    lane?: number;
  };
}

export interface TeamObjective {
  baron: { kills: number; first: boolean };
  champion: { kills: number; first: boolean };
  dragon: { kills: number; first: boolean };
  inhibitor: { kills: number; first: boolean };
  riftHerald: { kills: number; first: boolean };
  tower: { kills: number; first: boolean };
  voidGrub?: { kills: number; first: boolean };
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  objectives: TeamObjective;
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
  gameVersion?: string;
  averageRank?: string;
  queueId: number;
  participants: Participant[];
  me: Participant; // Shortcut to the main user's data within participants
  timelineData?: MatchTimelinePoint[];
  itemBuild?: ItemTimestamp[];
  teams?: MatchTeam[];
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

export interface ChampionTier {
  id: string;
  name: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  tier: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';
  rank: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  trend: 'up' | 'down' | 'stable';
  matches: number;
  counters: string[]; // Array of champion IDs (names)
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
  metrics?: PerformanceMetrics;
  consistencyBadge?: 'Rock Solid' | 'Coinflip' | 'Average';
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
  combat: number;
  objectives: number;
  vision: number;
  farming: number;
  survival: number;
  consistencyBadge?: string;
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

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId?: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RiotParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  championId?: number;
  teamId: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  totalDamageDealtToChampions?: number;
  visionScore?: number;
  goldEarned?: number;
  champLevel?: number;
  summoner1Id?: number;
  summoner2Id?: number;
  item0?: number;
  item1?: number;
  item2?: number;
  item3?: number;
  item4?: number;
  item5?: number;
  item6?: number;
  [key: string]: any;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation?: number;
    gameStartTimestamp?: number;
    gameDuration: number;
    gameMode?: string;
    queueId?: number;
    participants: RiotParticipant[];
    frames?: any[];
    [key: string]: any;
  };
}
