import os
import json
import psycopg2
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# --- CONFIGURATION ---
DB_URL = os.getenv("DATABASE_URL")
OUTPUT_FILE = "../scoring_weights.json"

def train_model():
    print("🚀 Starting Legend Score V5 Training...")
    
    if not DB_URL:
        print("❌ Error: DATABASE_URL environment variable not set.")
        return

    try:
        conn = psycopg2.connect(DB_URL)
        print("✅ Connected to Database.")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # 1. Fetch Data
    # We join SummonerMatch with Match to get gameDuration and other context
    query = """
    SELECT 
        sm.win,
        sm.kills, sm.deaths, sm.assists,
        sm."totalDamageDealtToChampions" as damage,
        sm."goldEarned" as gold,
        sm."visionScore" as vision,
        sm."totalMinionsKilled" + sm."neutralMinionsKilled" as cs,
        m."gameDuration" as duration,
        sm.role
    FROM "SummonerMatch" sm
    JOIN "Match" m ON sm."matchId" = m.id
    WHERE m."gameDuration" > 600
    LIMIT 50000;
    """
    
    print("📊 Fetching data...")
    df = pd.read_sql(query, conn)
    conn.close()
    
    if df.empty:
        print("⚠️ No data found. Run the match scanner first.")
        return

    print(f"✅ Loaded {len(df)} matches.")

    # 2. Feature Engineering
    # Normalize by duration (Per Minute stats)
    df['kda'] = (df['kills'] + df['assists']) / df['deaths'].replace(0, 1)
    df['dpm'] = df['damage'] / (df['duration'] / 60)
    df['gpm'] = df['gold'] / (df['duration'] / 60)
    df['vpm'] = df['vision'] / (df['duration'] / 60)
    df['cspm'] = df['cs'] / (df['duration'] / 60)

    features = ['kda', 'dpm', 'gpm', 'vpm', 'cspm']
    target = 'win'

    # 3. Train Model per Role
    weights = {}
    roles = df['role'].unique()

    for role in roles:
        if role == 'UNKNOWN': continue
        
        print(f"🧠 Training for {role}...")
        role_df = df[df['role'] == role]
        
        if len(role_df) < 100:
            print(f"⚠️ Not enough data for {role}, skipping.")
            continue

        X = role_df[features]
        y = role_df[target]

        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Logistic Regression
        model = LogisticRegression()
        model.fit(X_scaled, y)

        # Extract Coefficients (Weights)
        # We normalize them to sum to ~1.0 for our scoring system
        coefs = model.coef_[0]
        # Make them positive (we assume more is better)
        abs_coefs = [abs(c) for c in coefs]
        total = sum(abs_coefs)
        
        norm_weights = {
            'kda': abs_coefs[0] / total,
            'damage': abs_coefs[1] / total,
            'gold': abs_coefs[2] / total,
            'vision': abs_coefs[3] / total,
            'cs': abs_coefs[4] / total,
            'objective': 0.10, # Hard to get from simple query, keeping heuristic
            'utility': 0.05    # Hard to get from simple query, keeping heuristic
        }
        
        weights[role] = norm_weights

    # 4. Export
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(weights, f, indent=2)

    print(f"✅ Weights exported to {OUTPUT_FILE}")
    print("🎉 Done!")

if __name__ == "__main__":
    train_model()
