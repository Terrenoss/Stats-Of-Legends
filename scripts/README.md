# 🧠 Legend Score V5 - ML Training Script

This script trains a Logistic Regression model on your local database to find the optimal scoring weights for each role.

## Prerequisites

1.  **Python 3.8+** installed.
2.  **PostgreSQL** database running with `Stats-Of-Legends` data.

## Installation

1.  Navigate to the `scripts` folder:
    ```bash
    cd scripts
    ```

2.  Create a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install pandas psycopg2-binary scikit-learn
    ```

## Usage

1.  Ensure your `.env` file in the root directory contains the `DATABASE_URL`.
2.  Run the script:
    ```bash
    # Linux/Mac
    export DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
    python train_model.py

    # Windows (PowerShell)
    $env:DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
    python train_model.py
    ```

## Output

The script will generate a `scoring_weights.json` file in the root directory.
The `ScoringService` will automatically load this file if it exists to override the default heuristic weights.

## Troubleshooting

*   **"No data found"**: Ensure you have scanned matches in your database using the main application.
*   **"Connection Failed"**: Check your `DATABASE_URL` string.
