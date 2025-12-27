# Stats Of Legends - Architecture Documentation

## 1. Overview
**Stats Of Legends** is a League of Legends analytics platform built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma** (PostgreSQL), and **Tailwind CSS**. It provides summoner profiles, match history, and deep champion statistics derived from analyzed matches.

## 2. Project Structure

### Core Directories
- **`app/`**: Next.js App Router pages and API routes.
    - `api/`: Backend endpoints (e.g., `/api/summoner`, `/api/match/ranks`).
    - `[route]/`: Frontend pages (e.g., `summoner/[region]/[name]`).
- **`components/`**: React components.
    - `match/`: Match-related components (`MatchCard`, `MatchScoreboard`).
    - `builder/`: Item builder components.
- **`services/`**: Business logic and data access layer. **This is where the heavy lifting happens.**
- **`utils/`**: Pure utility functions (formatting, DDragon helpers, math).
- **`hooks/`**: Custom React hooks for state and logic reuse (e.g., `useMatchCard`).
- **`constants/`**: Static data, translations, and configuration.

## 3. Core Services

### `RiotService.ts`
- **Role**: The gateway to the Riot Games API.
- **Responsibilities**: Handles rate limiting, caching, and raw data fetching.
- **Key Methods**: `fetchMatchIds`, `fetchSummonerByPuuid`, `getChampionIdMap`.

### `MatchHistoryService.ts`
- **Role**: Manages user-specific match history.
- **Responsibilities**:
    - Fetches recent matches for a summoner.
    - Saves match data to the database (`Match`, `SummonerMatch`).
    - Triggers `MatchProcessor` for background analysis.
    - Formats match data for the frontend (`getMatchesForDisplay`).

### `MatchProcessor.ts`
- **Role**: The analytics engine.
- **Responsibilities**:
    - Processes individual matches to update global statistics.
    - Updates `ChampionStat`, `MatchupStat`, and `DuoStat` tables.
    - Calculates win rates, pick rates, and item performance.
    - **Optimization**: Runs asynchronously after a match is saved.

### `ChampionDetailService.ts`
- **Role**: Aggregator for Champion Pages.
- **Responsibilities**:
    - Queries the `ChampionStat` table.
    - Aggregates data across multiple entries (e.g., summing up item wins/matches).
    - Calculates Tier (S+, A, etc.) based on Win Rate and Pick Rate.
    - Returns structured data for the Champion Detail page.

## 4. Data Flow

### Scenario A: User Visits Summoner Profile
1.  **Frontend**: Calls `/api/summoner?name=...`.
2.  **API Route**: Calls `SummonerService.getOrUpdateSummoner`.
3.  **SummonerService**: Checks DB. If outdated, calls `RiotService` to update summoner data.
4.  **MatchHistoryService**: Fetches new match IDs from Riot.
5.  **Database**: Saves new matches.
6.  **MatchProcessor**: (Async) Analyzes new matches and updates global stats.
7.  **Frontend**: Receives formatted match history and renders `MatchCard`s.

### Scenario B: User Visits Champion Page
1.  **Frontend**: Calls `/api/champions/[name]`.
2.  **API Route**: Calls `ChampionDetailService.getChampionDetails`.
3.  **ChampionDetailService**: Aggregates millions of rows from `ChampionStat` (optimized via Prisma).
4.  **Frontend**: Renders win rates, builds, and counters.

## 5. Key Design Patterns

### Service-Repository Pattern
We use **Services** to encapsulate business logic. API routes should remain thin, delegating work to services.
- **Bad**: Writing Prisma queries directly in `app/api/...`.
- **Good**: Calling `MyService.getData()` in `app/api/...`.

### Component Composition
Complex UI is broken down into smaller, focused components.
- **Example**: `MatchCard` is composed of `MatchInfo`, `ChampionInfo`, `KDAInfo`, etc.
- **Refactoring**: Logic is extracted into hooks (e.g., `useMatchCard`) to keep components presentational.

### Type Safety
- **Interfaces**: Defined in `types.ts`.
- **No `any`**: We strive to use strict types (e.g., `RiotMatch`, `Participant`) to prevent runtime errors.

## 6. Conventions
- **Naming**: PascalCase for Components and Services (`MatchCard`, `RiotService`). camelCase for functions and variables.
- **State**: Use `useState` for local state, `zustand` (if needed) for global state.
- **Styling**: Tailwind CSS for everything. Avoid CSS modules unless necessary.
- **Icons**: `lucide-react`.

## 7. Common Utilities & Helpers (AVOID DUPLICATION)

Use these existing utilities instead of rewriting logic:

### `utils/ddragon.ts` (Data Dragon Helpers)
**Purpose**: Generates URLs for Riot assets (Champions, Items, Runes).
- `getChampionIconUrl(name)`: Returns champion icon URL.
- `getItemIconUrl(id)`: Returns item icon URL.
- `getSpellIconUrl(name)`: Returns summoner spell icon URL.
- `getRuneIconUrl(iconPath)`: Returns rune icon URL.

### `utils/formatUtils.ts` (Formatting)
**Purpose**: Common formatting logic for UI.
- `getTimeAgo(timestamp)`: Returns "2m ago", "1d ago".
- `getQueueLabel(match)`: Returns "Ranked Solo", "ARAM", etc.
- `getRankColor(tier)`: Returns hex color for rank (e.g., Gold -> #ffd700).
- `getKdaColorClass(kda)`: Returns Tailwind class for KDA coloring.

### `utils/rankUtils.ts` (Rank Logic)
**Purpose**: Calculations related to ranks.
- `getAverageRank(ranks[])`: Calculates average rank from a list of strings.

### `hooks/useMatchCard.ts` (Match Card Logic)
**Purpose**: Encapsulates state and logic for the Match Card component.
- `activeTab`: Current open tab.
- `toggleTab(tab)`: Handles tab switching.
- `fetchRanks()`: Fetches ranks for participants.

## 8. Data Model (Prisma)

The database is divided into two main domains: **User Data** and **Global Stats**.

### User Domain
- **`Summoner`**: Stores player identity (PUUID, Name, Level).
- **`Match`**: Stores raw match data (JSON) and metadata (Duration, Mode).
- **`SummonerMatch`**: Link table between Summoner and Match. Stores performance stats (KDA, Items) for that specific game.
- **`MatchAnalysis`**: Caches AI-generated analysis to avoid re-querying Gemini.

### Global Stats Domain (Aggregated)
- **`ChampionStat`**: The core of the tier list. Stores aggregated stats (Wins, Matches, Kills, etc.) grouped by `Champion + Role + Tier + Patch`.
- **`MatchupStat`**: Stores Head-to-Head stats (e.g., Ahri vs Yasuo).
- **`DuoStat`**: Stores Synergy stats (e.g., Lulu + Jinx).
- **`ScannedMatch`**: Tracks which matches have already been processed into the global stats to prevent duplicates.

## 9. Environment Variables

Create a `.env` file in the root directory with the following keys:

| Variable | Description | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/db`). | **Yes** |
| `RIOT_API_KEY` | Key from [developer.riotgames.com](https://developer.riotgames.com). | **Yes** |
| `GEMINI_API_KEY` | Google Gemini API Key for AI analysis. | **Yes** |
| `GEMINI_MODEL` | Model version (default: `gemini-2.5-flash`). | No |

## 10. How-To Guides

### How to Add a New Stat
1.  **Update Schema**: Add the field to `ChampionStat` in `prisma/schema.prisma`.
    ```prisma
    model ChampionStat {
      // ...
      newStat Int @default(0)
    }
    ```
2.  **Migrate**: Run `npx prisma migrate dev --name add_new_stat`.
3.  **Update Processor**: In `services/MatchProcessor.ts`, update the logic to calculate and increment this stat during match processing.
4.  **Update Service**: In `services/ChampionDetailService.ts`, ensure this stat is aggregated and returned to the frontend.

### How to Create a New Page
1.  **Create Route**: Create a new folder in `app/`, e.g., `app/leaderboard/page.tsx`.
2.  **Fetch Data**: Use a Service to fetch data. **Do not** query Prisma directly in the page component if possible (use Server Actions or API routes if client-side).
3.  **UI**: Create components in `components/leaderboard/` and import them.

### How to Update Static Data (DDragon)
- The app fetches the latest patch version automatically via `constants/index.ts`.
- If images break, check if `RiotService.ts` or `utils/ddragon.ts` needs a version bump or cache clear.
