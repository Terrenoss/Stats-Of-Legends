# Database Seeding Script

This script populates the database with match data from various tiers (Iron to Challenger) to establish statistical baselines for the Legend Score.

## Prerequisites

1.  **Node.js** and **npm** installed.
2.  **PostgreSQL** database running.
3.  `.env` file configured with `DATABASE_URL` and `RIOT_API_KEY`.
4.  `ts-node` installed globally or locally (usually included in devDependencies).

## Usage

To run the seeding script:

```bash
# Using npx ts-node
npx ts-node scripts/seed_database.ts
```

## Configuration

You can adjust the configuration constants at the top of `scripts/seed_database.ts`:

*   `REGION`: The Riot region to scan (default: EUW1).
*   `TARGET_MATCHES_PER_TIER`: How many matches to process per tier (default: 100).
*   `MATCHES_PER_PLAYER`: Max matches to fetch per player (default: 10).

## How it Works

1.  Iterates through each Rank Tier (Iron -> Challenger).
2.  Fetches a list of random players from that tier using the Riot API (`league-exp-v4`).
3.  Fetches the recent match history for each player.
4.  Processes each match using `MatchProcessor`, which:
    *   Calculates stats (KDA, CS, Vision, etc.).
    *   Updates `ChampionStat` and `MatchupStat` tables.
    *   Calculates Variance (`sumSquares`) for Lane Dominance.
5.  Saves the match ID to `ScannedMatch` to prevent re-processing.

## Rate Limiting

The script includes built-in delays (`await delay(...)`) to respect Riot API rate limits. If you have a Production API Key, you can reduce these delays.
