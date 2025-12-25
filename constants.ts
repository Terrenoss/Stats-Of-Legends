import { GameMode, Match, SummonerProfile, Item, Champion, DummyStats, Language, Region, HeatmapDay, LPPoint, DetailedChampionStats, RoleStat, Participant, Teammate, MatchTimelinePoint, ItemTimestamp, SeasonInfo } from './types';

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

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  FR: {
    home: "Accueil",
    builder: "Builder",
    leaderboard: "Classement",
    tierlist: "Tier List",
    searchPlaceholder: "Nom d'invocateur + Tag (ex: Faker#KR1)",
    go: "Go",
    heroTitle: "Maîtrisez votre",
    heroHighlight: "Jeu",
    heroDesc: "Statistiques détaillées, analyse par IA et suivi de progression pour League of Legends.",
    realTime: "Temps Réel",
    realTimeDesc: "Accédez aux données de match instantanément dès la fin de la partie.",
    aiCoach: "Coach AI",
    aiCoachDesc: "Notre IA Gemini 2.5 analyse vos builds et vos performances.",
    builderDesc: "Theorycraftez vos builds avec des stats précises et des analyses IA.",
    matchHistory: "Historique des matchs",
    playedChamps: "Champions Joués",
    win: "VICTOIRE",
    loss: "DÉFAITE",
    wins: "Wins",
    losses: "Losses",
    winrate: "Winrate",
    rankSolo: "Ranked Solo",
    normal: "Normal",
    analyze: "Analyser",
    loading: "Chargement...",
    reset: "Reset",
    analyzeBuild: "Analyser le Build avec IA",
    combatStats: "Stats de Combat",
    targetDummy: "Mannequin d'Entraînement",
    vitality: "Vitalité",
    offensive: "Offensif",
    defensive: "Défensif",
    utility: "Utilitaire",
    totalCost: "Coût Total",
    comboTotal: "Combo Total Estimé",
    autoAttack: "Auto-Attaque",
    damage: "Dégâts",
    level: "Niveau",
    change: "Changer",
    selectChamp: "Sélectionner un Champion",
    searchItem: "Rechercher un item...",
    maintenance: "Le classement régional est en cours de maintenance.",
    back: "Retour à la recherche",
    performance: "Performance",
    update: "Mettre à jour",
    overview: "Vue d'ensemble",
    champions: "Champions",
    liveGame: "Partie en direct",
    recentActivity: "Activité Récente",
    lpHistory: "Progression LP (30j)",
    roles: "Rôles Préférés",
    badDay: "Mauvais jour",
    goodDay: "Bon jour",
    recentlyPlayedWith: "Joué Récemment Avec",
    analysis: "Analyse",
    aiGraph: "Graphique AI",
    build: "Build",
    score: "Score",
    teamBlue: "Équipe Bleue",
    teamRed: "Équipe Rouge",
    pastRanks: "Saisons Précédentes",
    recent20Games: "20 Derniers Jeux",
    undo: "Annuler",
    redo: "Rétablir",
    ladderRank: "Rang Ladder",
    topPercent: "du top",
    lastUpdated: "Dernière mise à jour",
    stats: "Stats",
    damageDealt: "Dégâts Infligés",
    footerTitle: "Stats Of Legends",
    footerTagline: "La plateforme d'analyse nouvelle génération pour League of Legends. Optimisez vos builds, comprenez vos erreurs et grimpez le ladder grâce à notre IA Gemini 3.0.",
    navHome: "Accueil",
    navBuilder: "Builder Noxus",
    navLeaderboard: "Classement",
    apiStatus: "Statut de l'API",
    resources: "Ressources",
    riotApi: "Riot API",
    privacyPolicy: "Politique de confidentialité",
    termsOfService: "Conditions d'utilisation",
    contactSupport: "Support",
    placeholderToast: "est actuellement un lien de prévisualisation.",
    footerCopyright: "© 2025 Stats Of Legends. Tous droits réservés.",
    footerDisclaimer: "Stats Of Legends n'est pas approuvé par Riot Games et ne reflète pas les points de vue ou opinions de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion des propriétés de Riot Games. Riot Games et toutes les propriétés associées sont des marques ou des marques déposées de Riot Games, Inc.",
    noActiveGame: "Aucune partie en cours",
    liveLabel: "En direct",
    rankedSoloDuo: "Classée Solo/Duo",
    summonersRift: "Faille de l'invocateur",
    gameTime: "Durée de la partie",
    bannedChampions: "Champions bannis",
    blueTeam: "Équipe bleue",
    redTeam: "Équipe rouge",
    gamesPlayed: "parties jouées",
    hoursPlayed: "heures jouées",
    last120Days: "120 derniers jours"
  },
  EN: {
    home: "Home",
    builder: "Builder",
    leaderboard: "Leaderboard",
    tierlist: "Tier List",
    searchPlaceholder: "Summoner Name + Tag (e.g. Faker#KR1)",
    go: "Go",
    heroTitle: "Master your",
    heroHighlight: "Game",
    heroDesc: "Detailed statistics, AI analysis, and progress tracking for League of Legends.",
    realTime: "Real Time",
    realTimeDesc: "Access match data instantly after the game ends.",
    aiCoach: "AI Coach",
    aiCoachDesc: "Our Gemini 2.5 AI analyzes your builds and performance.",
    builderDesc: "Theorycraft your builds with precise stats and AI insights.",
    matchHistory: "Match History",
    playedChamps: "Played Champions",
    win: "VICTORY",
    loss: "DEFEAT",
    wins: "Wins",
    losses: "Losses",
    winrate: "Winrate",
    rankSolo: "Ranked Solo",
    normal: "Normal",
    analyze: "Analyze",
    loading: "Loading...",
    reset: "Reset",
    analyzeBuild: "Analyze Build with AI",
    combatStats: "Combat Stats",
    targetDummy: "Target Dummy",
    vitality: "Vitality",
    offensive: "Offensive",
    defensive: "Defensive",
    utility: "Utility",
    totalCost: "Total Cost",
    comboTotal: "Estimated Total Combo",
    autoAttack: "Auto-Attack",
    damage: "Damage",
    level: "Level",
    change: "Change",
    selectChamp: "Select a Champion",
    searchItem: "Search for an item...",
    maintenance: "Regional leaderboard is currently under maintenance.",
    back: "Back to search",
    performance: "Performance",
    update: "Update",
    overview: "Overview",
    champions: "Champions",
    liveGame: "Live Game",
    recentActivity: "Recent Activity",
    lpHistory: "LP Progress (30d)",
    roles: "Preferred Roles",
    badDay: "Bad day",
    goodDay: "Good day",
    recentlyPlayedWith: "Recently Played With",
    analysis: "Analysis",
    aiGraph: "AI Graph",
    build: "Build",
    score: "Score",
    teamBlue: "Blue Team",
    teamRed: "Red Team",
    pastRanks: "Past Ranks",
    recent20Games: "Last 20 Games",
    undo: "Undo",
    redo: "Redo",
    ladderRank: "Ladder Rank",
    topPercent: "of top",
    lastUpdated: "Last updated",
    stats: "Stats",
    damageDealt: "Damage Dealt",
    footerTitle: "Stats Of Legends",
    footerTagline: "Next-generation analytics platform for League of Legends. Optimize your builds, understand your mistakes, and climb the ladder with our Gemini 3.0 AI.",
    navHome: "Home",
    navBuilder: "Noxus Builder",
    navLeaderboard: "Leaderboard",
    apiStatus: "API Status",
    resources: "Resources",
    riotApi: "Riot API",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contactSupport: "Contact Support",
    placeholderToast: "is currently a placeholder link.",
    footerCopyright: "© 2025 Stats Of Legends. All rights reserved.",
    footerDisclaimer: "Stats Of Legends isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.",
    noActiveGame: "No Active Game Found",
    liveLabel: "Live",
    rankedSoloDuo: "Ranked Solo/Duo",
    summonersRift: "Summoner's Rift",
    gameTime: "Game Time",
    bannedChampions: "Banned Champions",
    blueTeam: "Blue Team",
    redTeam: "Red Team",
    gamesPlayed: "games played",
    hoursPlayed: "hours played",
    last120Days: "Last 120 Days"
  },
  ES: {
    home: "Inicio",
    builder: "Constructor",
    leaderboard: "Clasificación",
    tierlist: "Tier List",
    searchPlaceholder: "Nombre de Invocador + Tag",
    go: "Ir",
    heroTitle: "Domina tu",
    heroHighlight: "Juego",
    heroDesc: "Estadísticas détaillées, análisis de IA y seguimiento de progreso.",
    realTime: "Tiempo Real",
    realTimeDesc: "Accede a los datos del partido al instante.",
    aiCoach: "Entrenador IA",
    aiCoachDesc: "Nuestra IA Gemini 2.5 analiza tus builds.",
    builderDesc: "Crea tus builds con estadísticas precisas.",
    matchHistory: "Historial de Partidas",
    playedChamps: "Campeones Jugados",
    win: "VICTORIA",
    loss: "DERROTA",
    wins: "Victorias",
    losses: "Derrotas",
    winrate: "Winrate",
    rankSolo: "Ranked Solo",
    normal: "Normal",
    analyze: "Analizar",
    loading: "Cargando...",
    reset: "Reiniciar",
    analyzeBuild: "Analizar Build con IA",
    combatStats: "Estadísticas de Combate",
    targetDummy: "Muñeco de Práctica",
    vitality: "Vitalidad",
    offensive: "Ofensivo",
    defensive: "Defensivo",
    utility: "Utilidad",
    totalCost: "Coste Total",
    comboTotal: "Combo Total Estimado",
    autoAttack: "Auto-Ataque",
    damage: "Daño",
    level: "Nivel",
    change: "Cambiar",
    selectChamp: "Seleccionar Campeón",
    searchItem: "Buscar un objeto...",
    maintenance: "La clasificación regional está en mantenimiento.",
    back: "Volver a la búsqueda",
    performance: "Rendimiento",
    update: "Actualizar",
    overview: "Resumen",
    champions: "Campeones",
    liveGame: "En Vivo",
    recentActivity: "Actividad Reciente",
    lpHistory: "Progreso LP (30d)",
    roles: "Roles Preferidos",
    badDay: "Mal día",
    goodDay: "Buen día",
    recentlyPlayedWith: "Jugado Recientemente Con",
    analysis: "Análisis",
    aiGraph: "Gráfico IA",
    build: "Build",
    score: "Puntuación",
    teamBlue: "Equipo Azul",
    teamRed: "Equipo Rojo",
    pastRanks: "Rangos Pasados",
    recent20Games: "Últimos 20 Juegos",
    undo: "Deshacer",
    redo: "Rehacer",
    ladderRank: "Rango de Escalera",
    topPercent: "del top",
    lastUpdated: "Última actualización",
    stats: "Estadísticas",
    damageDealt: "Daño Infligido",
    footerTitle: "Stats Of Legends",
    footerTagline: "La plataforma de análisis de nueva generación para League of Legends. Optimiza tus builds, entiende tus errores y escala en el ladder con nuestra IA Gemini 3.0.",
    navHome: "Inicio",
    navBuilder: "Constructor Noxus",
    navLeaderboard: "Clasificación",
    apiStatus: "Estado de la API",
    resources: "Recursos",
    riotApi: "Riot API",
    privacyPolicy: "Política de privacidad",
    termsOfService: "Términos de servicio",
    contactSupport: "Soporte",
    placeholderToast: "es actualmente un enlace de prueba.",
    footerCopyright: "© 2025 Stats Of Legends. Todos los derechos reservados.",
    footerDisclaimer: "Stats Of Legends no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de nadie involucrado oficialmente en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.",
    noActiveGame: "No se encontró partida activa",
    liveLabel: "En vivo",
    rankedSoloDuo: "Clasificatoria Solo/Dúo",
    summonersRift: "Grieta del Invocador",
    gameTime: "Tiempo de partida",
    bannedChampions: "Campeones bloqueados",
    blueTeam: "Equipo azul",
    redTeam: "Equipo rojo",
    gamesPlayed: "partidas jugadas",
    hoursPlayed: "horas jugadas",
    last120Days: "Últimos 120 días"
  },
  KR: {
    home: "홈",
    builder: "빌더",
    leaderboard: "랭킹",
    tierlist: "티어 리스트",
    searchPlaceholder: "소환사 이름 + 태그 (예: Faker#KR1)",
    go: "검색",
    heroTitle: "당신의 게임을",
    heroHighlight: "지배하세요",
    heroDesc: "리그 오브 레전드를 위한 상세 통계, AI 분석 및 진행 상황 추적.",
    realTime: "실시간",
    realTimeDesc: "게임 종료 후 즉시 매치 데이터에 액세스하세요.",
    aiCoach: "AI 코치",
    aiCoachDesc: "Gemini 2.5 AI가 빌드와 성과를 분석합니다.",
    builderDesc: "정밀한 통계와 AI 통찰력으로 빌드를 연구하세요.",
    matchHistory: "전적",
    playedChamps: "플레이한 챔피언",
    win: "승리",
    loss: "패배",
    wins: "승",
    losses: "패",
    winrate: "승률",
    rankSolo: "솔로 랭크",
    normal: "일반",
    analyze: "분석",
    loading: "로딩 중...",
    reset: "초기화",
    analyzeBuild: "AI로 빌드 분석",
    combatStats: "전투 통계",
    targetDummy: "연습용 봇",
    vitality: "생명력",
    offensive: "공격",
    defensive: "방어",
    utility: "유틸리티",
    totalCost: "총 비용",
    comboTotal: "예상 총 콤보",
    autoAttack: "기본 공격",
    damage: "피해량",
    level: "레벨",
    change: "변경",
    selectChamp: "챔피언 선택",
    searchItem: "아이템 검색...",
    maintenance: "지역 랭킹은 현재 점검 중입니다.",
    back: "검색으로 돌아가기",
    performance: "성능",
    update: "업데이트",
    overview: "개요",
    champions: "챔피언",
    liveGame: "라이브 게임",
    recentActivity: "최근 활동",
    lpHistory: "LP 변동 (30일)",
    roles: "선호 역할군",
    badDay: "나쁜 날",
    goodDay: "좋은 날",
    recentlyPlayedWith: "최근 함께 플레이",
    analysis: "분석",
    aiGraph: "AI 그래프",
    build: "빌드",
    score: "점수",
    teamBlue: "블루 팀",
    teamRed: "레드 팀",
    pastRanks: "지난 시즌 랭크",
    recent20Games: "최근 20 게임",
    undo: "실행 취소",
    redo: "다시 실행",
    ladderRank: "래더 랭킹",
    topPercent: "상위",
    lastUpdated: "마지막 업데이트",
    stats: "통계",
    damageDealt: "가한 피해량",
    footerTitle: "Stats Of Legends",
    footerTagline: "리그 오브 레전드를 위한 차세대 분석 플랫폼. 빌드를 최적화하고 실수를 이해하며 Gemini 3.0 AI로 랭크를 올리세요.",
    navHome: "홈",
    navBuilder: "녹서스 빌더",
    navLeaderboard: "랭킹",
    apiStatus: "API 상태",
    resources: "자료실",
    riotApi: "Riot API",
    privacyPolicy: "개인정보 처리방침",
    termsOfService: "이용 약관",
    contactSupport: "문의하기",
    placeholderToast: "는 현재 미구현 링크입니다.",
    footerCopyright: "© 2025 Stats Of Legends. 모든 권리 보유.",
    footerDisclaimer: "Stats Of Legends는 Riot Games의 승인을 받지 않았으며 Riot Games 또는 Riot Games 관련 프로젝트 담당자의 의견을 반영하지 않습니다. Riot Games 및 모든 관련 자산은 Riot Games, Inc.의 상표 또는 등록 상표입니다.",
    noActiveGame: "진행 중인 게임이 없습니다",
    liveLabel: "라이브",
    rankedSoloDuo: "솔로/듀오 랭크",
    summonersRift: "소환사의 협곡",
    gameTime: "게임 시간",
    bannedChampions: "밴된 챔피언",
    blueTeam: "블루 팀",
    redTeam: "레드 팀",
    gamesPlayed: "판 플레이",
    hoursPlayed: "시간 플레이",
    last120Days: "최근 120일"
  }
};

// Placeholder images
export const PLACEHOLDER_CHAMP = "https://picsum.photos/64/64";
export const PLACEHOLDER_ITEM = "https://picsum.photos/32/32";
export const PLACEHOLDER_SPELL = "https://picsum.photos/32/32";

// Mock data
export const MOCK_PROFILE: SummonerProfile = {
  name: "Faker",
  tag: "KR1",
  level: 684,
  profileIconId: 1,
  ranks: {
    solo: {
      tier: "CHALLENGER",
      rank: "I",
      lp: 1450,
      wins: 240,
      losses: 180
    },
    flex: {
      tier: "GRANDMASTER",
      rank: "I",
      lp: 620,
      wins: 80,
      losses: 45
    }
  },
  pastRanks: [
    { season: "S2024-1", tier: "CHALLENGER", rank: "I" },
    { season: "S2023", tier: "CHALLENGER", rank: "I" },
    { season: "S2022", tier: "GRANDMASTER", rank: "I" }
  ],
  ladderRank: 629753,
  topPercent: 16.52,
  lastUpdated: Date.now() - (4 * 24 * 60 * 60 * 1000), // 4 days ago
  metrics: {
    combat: 75,
    objectives: 60,
    vision: 45,
    farming: 80,
    survival: 70,
    consistencyBadge: 'Rock Solid'
  }
};

export const MOCK_TEAMMATES: Teammate[] = [
  { name: "Keria", tag: "T1", profileIconId: 2, games: 15, wins: 12, losses: 3, winrate: 80 },
  { name: "Zeus", tag: "T1", profileIconId: 3, games: 12, wins: 8, losses: 4, winrate: 66 },
  { name: "Oner", tag: "T1", profileIconId: 4, games: 10, wins: 5, losses: 5, winrate: 50 },
  { name: "Gumayusi", tag: "T1", profileIconId: 5, games: 8, wins: 6, losses: 2, winrate: 75 },
];

export const MOCK_LP_HISTORY: LPPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    fullDate: d.toLocaleDateString('fr-FR'),
    lp: 1400 + Math.floor(Math.sin(i * 0.5) * 50 + Math.random() * 30),
    tier: "CHALLENGER",
    rank: "I"
  };
});

export const MOCK_HEATMAP_DATA: HeatmapDay[] = Array.from({ length: 120 }, (_, i) => {
  const games = Math.floor(Math.random() * 8); // 0 to 7 games
  const wins = Math.floor(Math.random() * (games + 1));
  let intensity: 0 | 1 | 2 | 3 | 4 = 0;
  if (games > 0) {
    const winrate = wins / games;
    if (winrate >= 0.6) intensity = 4; // Great
    else if (winrate >= 0.5) intensity = 3; // Good
    else if (winrate >= 0.4) intensity = 2; // Bad
    else intensity = 1; // Terrible
  }
  return {
    date: new Date(Date.now() - (119 - i) * 86400000).toISOString(),
    games,
    wins,
    losses: games - wins,
    intensity
  };
});

export const MOCK_ROLES: RoleStat[] = [
  { role: 'MID', games: 240, winrate: 58 },
  { role: 'TOP', games: 45, winrate: 48 },
  { role: 'JUNGLE', games: 12, winrate: 42 },
  { role: 'ADC', games: 8, winrate: 30 },
  { role: 'SUPPORT', games: 5, winrate: 50 },
];

export const MOCK_DETAILED_CHAMPIONS: DetailedChampionStats[] = [
  {
    id: 103,
    name: "Ahri",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png",
    games: 91,
    wins: 50,
    losses: 41,
    kda: 3.09,
    kills: 5.6,
    deaths: 4.7,
    assists: 9.0,
    dmgPerMinute: 821,
    dmgTakenPerMinute: 892,
    csPerMinute: 7.0,
    gd15: 57,
    csd15: 5.9,
    dmgPercentage: 22.1
  },
  {
    id: 517,
    name: "Sylas",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Sylas.png",
    games: 18,
    wins: 8,
    losses: 10,
    kda: 1.53,
    kills: 4.2,
    deaths: 6.8,
    assists: 6.2,
    dmgPerMinute: 711,
    dmgTakenPerMinute: 919,
    csPerMinute: 5.9,
    gd15: -224,
    csd15: -2.1,
    dmgPercentage: 19.3
  },
  {
    id: 61,
    name: "Orianna",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Orianna.png",
    games: 15,
    wins: 8,
    losses: 7,
    kda: 2.77,
    kills: 3.5,
    deaths: 3.2,
    assists: 8.8,
    dmgPerMinute: 780,
    dmgTakenPerMinute: 650,
    csPerMinute: 8.2,
    gd15: 120,
    csd15: 8.5,
    dmgPercentage: 24.5
  },
  {
    id: 711,
    name: "Vex",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Vex.png",
    games: 11,
    wins: 7,
    losses: 4,
    kda: 1.66,
    kills: 5.1,
    deaths: 6.0,
    assists: 4.8,
    dmgPerMinute: 890,
    dmgTakenPerMinute: 800,
    csPerMinute: 6.5,
    gd15: -50,
    csd15: -1.2,
    dmgPercentage: 26.0
  },
  {
    id: 3,
    name: "Galio",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Galio.png",
    games: 10,
    wins: 3,
    losses: 7,
    kda: 2.84,
    kills: 2.1,
    deaths: 3.5,
    assists: 10.2,
    dmgPerMinute: 550,
    dmgTakenPerMinute: 1100,
    csPerMinute: 5.2,
    gd15: -100,
    csd15: -5.0,
    dmgPercentage: 15.2
  },
  {
    id: 131,
    name: "Diana",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Diana.png",
    games: 9,
    wins: 4,
    losses: 5,
    kda: 2.04,
    kills: 6.2,
    deaths: 5.5,
    assists: 5.0,
    dmgPerMinute: 760,
    dmgTakenPerMinute: 790,
    csPerMinute: 7.1,
    gd15: 45,
    csd15: 2.2,
    dmgPercentage: 21.0
  }
];

export const MOCK_CHAMPIONS: Champion[] = [
  {
    id: 1,
    name: "Ahri",
    title: "The Nine-Tailed Fox",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png",
    baseStats: { hp: 590, mp: 418, mpRegen: 8, ad: 53, ap: 0, armor: 21, mr: 30, haste: 0, crit: 0, moveSpeed: 330, attackSpeed: 0.668, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 96, mp: 25, mpRegen: 0.8, ad: 3, armor: 4.7, mr: 1.3, attackSpeed: 2 }, // AS is % growth
    spells: [
      {
        id: 'Q',
        name: 'Orb of Deception',
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriQ.png',
        description: "Ahri envoie son orbe puis le rappelle, infligeant des dégâts magiques à l'aller et des dégâts bruts au retour.",
        maxRank: 5,
        cooldown: [7, 7, 7, 7, 7],
        cost: [55, 65, 75, 85, 95],
        baseDamage: [40, 65, 90, 115, 140], // Per pass (so x2 total potential)
        ratios: { ap: 0.45 }, // Per pass
        damageType: 'magic' // Simplified mix
      },
      {
        id: 'W',
        name: 'Fox-Fire',
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriW.png',
        description: "Ahri libère 3 feux de renard qui verrouillent les ennemis proches.",
        maxRank: 5,
        cooldown: [9, 8, 7, 6, 5],
        cost: [30, 30, 30, 30, 30],
        baseDamage: [50, 75, 100, 125, 150],
        ratios: { ap: 0.30 },
        damageType: 'magic'
      },
      {
        id: 'E',
        name: 'Charm',
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriE.png',
        description: "Ahri envoie un baiser qui inflige des dégâts et charme le premier ennemi touché.",
        maxRank: 5,
        cooldown: [14, 12, 12, 12, 12],
        cost: [80, 80, 80, 80, 80],
        baseDamage: [80, 110, 140, 170, 200],
        ratios: { ap: 0.60 },
        damageType: 'magic'
      },
      {
        id: 'R',
        name: 'Spirit Rush',
        imageUrl: 'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/AhriR.png',
        description: "Ahri se rue vers l'avant et tire des éclairs d'essence (3 charges).",
        maxRank: 3,
        cooldown: [130, 105, 80],
        cost: [100, 100, 100],
        baseDamage: [60, 90, 120], // Per bolt
        ratios: { ap: 0.35 },
        damageType: 'magic'
      }
    ]
  },
  {
    id: 2,
    name: "Darius",
    title: "Hand of Noxus",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Darius.png",
    baseStats: { hp: 652, mp: 263, mpRegen: 6.6, ad: 64, ap: 0, armor: 39, mr: 32, haste: 0, crit: 0, moveSpeed: 340, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 114, mp: 57.5, mpRegen: 0.35, ad: 5, armor: 5.2, mr: 2.05, attackSpeed: 1 }
  },
  {
    id: 3,
    name: "Jinx",
    title: "The Loose Cannon",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Jinx.png",
    baseStats: { hp: 630, mp: 260, mpRegen: 6.7, ad: 59, ap: 0, armor: 26, mr: 30, haste: 0, crit: 0, moveSpeed: 325, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 105, mp: 50, mpRegen: 1, ad: 3.15, armor: 4.2, mr: 1.3, attackSpeed: 1 }
  },
  {
    id: 4,
    name: "Leona",
    title: "The Radiant Dawn",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Leona.png",
    baseStats: { hp: 646, mp: 302, mpRegen: 6, ad: 60, ap: 0, armor: 47, mr: 32, haste: 0, crit: 0, moveSpeed: 335, attackSpeed: 0.625, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 112, mp: 40, mpRegen: 0.8, ad: 3, armor: 4.8, mr: 2.05, attackSpeed: 2.9 }
  },
  {
    id: 5,
    name: "Zed",
    title: "The Master of Shadows",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Zed.png",
    baseStats: { hp: 654, mp: 200, mpRegen: 50, ad: 63, ap: 0, armor: 32, mr: 32, haste: 0, crit: 0, moveSpeed: 345, attackSpeed: 0.651, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 99, mp: 0, mpRegen: 0, ad: 3.4, armor: 4.7, mr: 2.05, attackSpeed: 3.3 }
  },
  {
    id: 6,
    name: "Lux",
    title: "The Lady of Luminosity",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Lux.png",
    baseStats: { hp: 580, mp: 480, mpRegen: 8, ad: 54, ap: 0, armor: 21, mr: 30, haste: 0, crit: 0, moveSpeed: 330, attackSpeed: 0.669, magicPen: 0, lethality: 0 },
    statsGrowth: { hp: 99, mp: 25, mpRegen: 0.8, ad: 3.3, armor: 4, mr: 1.3, attackSpeed: 1.36 }
  }
];

export const MOCK_CHAMPION = MOCK_CHAMPIONS[0];

export const DEFAULT_DUMMY: DummyStats = {
  hp: 2000,
  armor: 70,
  mr: 70
};

// Builder items
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
    stats: { hp: 800, haste: 0, mr: 0, armor: 0, ad: 0, ap: 0, crit: 0, moveSpeed: 0, mpRegen: 200 },
    description: "PV infinis stackables.",
    passive: "Colossal Consumption : Chargez une attaque puissante contre un champion pour gagner des PV max permanents.",
    tags: ['Legendary', 'Mythic']
  },
  {
    id: 9,
    name: "Jak'Sho",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/6665.png",
    price: 3200,
    stats: { hp: 300, armor: 50, mr: 50, haste: 0, ad: 0, ap: 0, crit: 0, moveSpeed: 0 },
    description: "Tanking ultime en combat prolongé.",
    passive: "Voidborn Resilience : En combat, augmente vos résistances bonus jusqu'à 30%.",
    tags: ['Legendary', 'Mythic']
  },
  {
    id: 10,
    name: "Blade of the Ruined King",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3153.png",
    price: 3200,
    stats: { ad: 40, haste: 0, moveSpeed: 0, crit: 0, attackSpeed: 25, mr: 0, armor: 0, hp: 0, ap: 0 },
    description: "Vol de vie et dégâts % PV actuels.",
    passive: "Mist's Edge : Les attaques infligent des dégâts physiques équivalents à 12% des PV actuels de la cible.",
    tags: ['Legendary']
  },
  {
    id: 11,
    name: "Void Staff",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3135.png",
    price: 2800,
    stats: { ap: 80, magicPen: 40 }, // 40% pen
    description: "Pénétration magique brute.",
    passive: "Dissolve : Ignore 40% de la résistance magique de la cible.",
    tags: ['Legendary']
  },
  {
    id: 12,
    name: "Collector",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/6676.png",
    price: 3100,
    stats: { ad: 60, crit: 20, lethality: 12 },
    description: "Exécution des cibles faibles.",
    passive: "Death and Taxes : Si vous infligez des dégâts laissant un champion sous 5% PV, il est exécuté.",
    tags: ['Legendary']
  },
  {
    id: 13,
    name: "Doran's Ring",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/1056.png",
    price: 400,
    stats: { ap: 15, hp: 70 },
    description: "Starter AP",
    passive: "",
    tags: ['Starter']
  },
  {
    id: 14,
    name: "Boots",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/1001.png",
    price: 300,
    stats: { moveSpeed: 25 },
    description: "Speed",
    passive: "",
    tags: ['Boots']
  },
  {
    id: 15,
    name: "Lost Chapter",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3802.png",
    price: 1100,
    stats: { ap: 40, haste: 10, mp: 300 },
    description: "Mana component",
    passive: "",
    tags: ['Component']
  },
  {
    id: 16,
    name: "Sorcerer's Shoes",
    imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/item/3020.png",
    price: 1100,
    stats: { moveSpeed: 45, magicPen: 18 },
    description: "Magic Pen Boots",
    passive: "",
    tags: ['Boots']
  }
];

// Helper to generate a full participant list for a match
const generateParticipants = (myChampId: number, isWin: boolean): Participant[] => {
  const list: Participant[] = [];

  // Me (Blue Team usually in this mock)
  const totalDmg = isWin ? 32000 : 21000;
  list.push({
    summonerName: "Faker",
    tagLine: "KR1",
    champion: MOCK_CHAMPIONS.find(c => c.id === myChampId) || MOCK_CHAMPIONS[0],
    teamId: 100,
    kills: isWin ? 12 : 4,
    deaths: isWin ? 2 : 5,
    assists: isWin ? 8 : 12,
    cs: isWin ? 240 : 180,
    win: isWin,
    items: BUILDER_ITEMS.slice(0, 6),
    spells: [],
    visionScore: 35,
    totalDamageDealtToChampions: totalDmg,
    physicalDamageDealtToChampions: Math.floor(totalDmg * 0.1),
    magicDamageDealtToChampions: Math.floor(totalDmg * 0.8),
    trueDamageDealtToChampions: Math.floor(totalDmg * 0.1),
    // added: totalDamageTaken for compatibility with components
    totalDamageTaken: isWin ? Math.floor(totalDmg * 0.5) : Math.floor(totalDmg * 0.8),
    goldEarned: isWin ? 14500 : 10000,
    level: 17,
    rank: "CHALLENGER",
    opScore: isWin ? 92 : 64
  });

  // 4 Teammates (Blue)
  for (let i = 0; i < 4; i++) {
    const dmg = Math.floor(Math.random() * 25000) + 5000;
    list.push({
      summonerName: `Teammate ${i + 1}`,
      tagLine: "KR1",
      champion: MOCK_CHAMPIONS[(i + 1) % MOCK_CHAMPIONS.length],
      teamId: 100,
      kills: Math.floor(Math.random() * 10),
      deaths: Math.floor(Math.random() * 10),
      assists: Math.floor(Math.random() * 15),
      cs: Math.floor(Math.random() * 250),
      win: isWin,
      items: BUILDER_ITEMS.slice(0, 5),
      spells: [],
      visionScore: Math.floor(Math.random() * 50),
      totalDamageDealtToChampions: dmg,
      physicalDamageDealtToChampions: Math.floor(dmg * 0.4),
      magicDamageDealtToChampions: Math.floor(dmg * 0.4),
      trueDamageDealtToChampions: Math.floor(dmg * 0.2),
      // added
      totalDamageTaken: Math.floor(dmg * 0.6),
      goldEarned: Math.floor(Math.random() * 12000) + 6000,
      level: Math.floor(Math.random() * 4) + 14,
      rank: "CHALLENGER",
      opScore: Math.floor(Math.random() * 40) + 50
    });
  }

  // 5 Enemies (Red)
  for (let i = 0; i < 5; i++) {
    const dmg = Math.floor(Math.random() * 25000) + 5000;
    list.push({
      summonerName: `Enemy ${i + 1}`,
      tagLine: "KR1",
      champion: MOCK_CHAMPIONS[(i + 3) % MOCK_CHAMPIONS.length],
      teamId: 200,
      kills: Math.floor(Math.random() * 10),
      deaths: Math.floor(Math.random() * 10),
      assists: Math.floor(Math.random() * 15),
      cs: Math.floor(Math.random() * 250),
      win: !isWin,
      items: BUILDER_ITEMS.slice(0, 5),
      spells: [],
      visionScore: Math.floor(Math.random() * 50),
      totalDamageDealtToChampions: dmg,
      physicalDamageDealtToChampions: Math.floor(dmg * 0.4),
      magicDamageDealtToChampions: Math.floor(dmg * 0.4),
      trueDamageDealtToChampions: Math.floor(dmg * 0.2),
      // added
      totalDamageTaken: Math.floor(dmg * 0.6),
      goldEarned: Math.floor(Math.random() * 12000) + 6000,
      level: Math.floor(Math.random() * 4) + 14,
      rank: "GRANDMASTER",
      opScore: Math.floor(Math.random() * 40) + 50
    });
  }

  return list;
};

// Timeline generator
const generateTimeline = (isWin: boolean): MatchTimelinePoint[] => {
  const points: MatchTimelinePoint[] = [];
  let blueScore = 50;
  let redScore = 50;

  for (let i = 0; i <= 30; i += 2) {
    const randomShift = Math.random() * 5;
    if (isWin) {
      blueScore += (i > 10 ? randomShift : randomShift * 0.5); // Snowball
      redScore -= (i > 10 ? randomShift * 0.8 : randomShift * 0.4);
    } else {
      blueScore -= (i > 10 ? randomShift : randomShift * 0.5);
      redScore += (i > 10 ? randomShift : randomShift * 0.5);
    }

    let event = undefined;
    if (i === 8) event = "Herald";
    if (i === 14) event = "Drake";
    if (i === 22) event = "Baron";

    points.push({
      timestamp: `${i}m`,
      blueScore: Math.max(0, Math.min(100, blueScore)),
      redScore: Math.max(0, Math.min(100, redScore)),
      event
    });
  }
  return points;
};

// Build path generator
const generateBuildPath = (): ItemTimestamp[] => {
  return [
    { item: BUILDER_ITEMS[12], timestamp: "0m" }, // Ring
    { item: BUILDER_ITEMS[13], timestamp: "5m" }, // Boots
    { item: BUILDER_ITEMS[14], timestamp: "8m" }, // Lost Chapter
    { item: BUILDER_ITEMS[0], timestamp: "12m" }, // Luden
    { item: BUILDER_ITEMS[15], timestamp: "15m" }, // Sorc Shoes
    { item: BUILDER_ITEMS[2], timestamp: "22m" }, // Shadowflame
    { item: BUILDER_ITEMS[5], timestamp: "28m" }, // Zhonya
    { item: BUILDER_ITEMS[1], timestamp: "35m" }, // Rabadon
  ];
};

// Mock Matches
export const MOCK_MATCHES: Match[] = [
  {
    id: "KR_1234567890",
    gameCreation: Date.now() - 3600000,
    gameDuration: 1845, // seconds
    gameMode: GameMode.SOLO_DUO,
    queueId: 420,
    participants: generateParticipants(1, true),
    timelineData: generateTimeline(true),
    itemBuild: generateBuildPath(),
    me: {
      summonerName: "Faker",
      champion: { id: 1, name: "Ahri", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png" },
      kills: 12,
      deaths: 2,
      assists: 8,
      cs: 240,
      win: true,
      items: BUILDER_ITEMS.slice(0, 6),
      spells: [
        { id: 4, name: "Flash", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/SummonerFlash.png" },
        { id: 14, name: "Ignite", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/SummonerDot.png" }
      ],
      visionScore: 35,
      totalDamageDealtToChampions: 32000,
      physicalDamageDealtToChampions: 3200,
      magicDamageDealtToChampions: 25600,
      trueDamageDealtToChampions: 3200,
      // added
      totalDamageTaken: 12000,
      goldEarned: 14500,
      level: 18,
      teamId: 100,
      opScore: 92
    }
  },
  {
    id: "KR_0987654321",
    gameCreation: Date.now() - 86400000,
    gameDuration: 2100,
    gameMode: GameMode.SOLO_DUO,
    queueId: 420,
    participants: generateParticipants(2, false),
    timelineData: generateTimeline(false),
    itemBuild: generateBuildPath(),
    me: {
      summonerName: "Faker",
      champion: { id: 2, name: "Azir", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Azir.png" },
      kills: 4,
      deaths: 5,
      assists: 12,
      cs: 310,
      win: false,
      items: [
        BUILDER_ITEMS[4], BUILDER_ITEMS[5], BUILDER_ITEMS[1]
      ],
      spells: [
        { id: 4, name: "Flash", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/SummonerFlash.png" },
        { id: 12, name: "Teleport", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/SummonerTeleport.png" }
      ],
      visionScore: 42,
      totalDamageDealtToChampions: 28000,
      physicalDamageDealtToChampions: 2000,
      magicDamageDealtToChampions: 25000,
      trueDamageDealtToChampions: 1000,
      // added
      totalDamageTaken: 15000,
      goldEarned: 11200,
      level: 16,
      teamId: 100,
      opScore: 64
    }
  },
  {
    id: "KR_11223344",
    gameCreation: Date.now() - 172800000,
    gameDuration: 1500,
    gameMode: GameMode.FLEX,
    queueId: 440,
    participants: generateParticipants(3, true),
    timelineData: generateTimeline(true),
    itemBuild: generateBuildPath(),
    me: {
      summonerName: "Faker",
      champion: { id: 3, name: "Jinx", imageUrl: "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Jinx.png" },
      kills: 15,
      deaths: 1,
      assists: 5,
      cs: 280,
      win: true,
      items: BUILDER_ITEMS.slice(0, 6),
      spells: [],
      visionScore: 20,
      totalDamageDealtToChampions: 40000,
      physicalDamageDealtToChampions: 38000,
      magicDamageDealtToChampions: 1000,
      trueDamageDealtToChampions: 1000,
      // added
      totalDamageTaken: 9000,
      goldEarned: 16000,
      level: 16,
      teamId: 100,
      opScore: 88
    }
  }
];
