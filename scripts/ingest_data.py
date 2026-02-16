import pandas as pd
from sqlalchemy import create_engine, text
import os
import sys
from pathlib import Path
# Add project root to sys.path to allow importing utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.logger import get_logger



# Configure logging
log = get_logger(__name__)

# Database Configuration
DB_USER = os.getenv('POSTGRES_USER', 'user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = os.getenv('POSTGRES_DB', 'stock_db')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_engine():
    return create_engine(DATABASE_URL)

def ingest_data(file_path):
    if not os.path.exists(file_path):
        log.error(f"File not found: {file_path}")
        return

    log.info(f"Reading data from {file_path}...")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        log.error(f"Failed to read CSV: {e}")
        return

    # Mapping of CSV columns to internal database field expectations
    column_mapping = {
        'ticker': 'ticker',
        'sentiment_score': 'sentiment_score',
        'confidence_level': 'confidence_level',
        'platform': 'platform',
        'created_at': 'created_at'
    }

    # Normalize columns to lowercase for consistency
    df.columns = [c.lower() for c in df.columns]
    
    # Check for required columns based on our mapping
    required_columns = list(column_mapping.keys())
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        log.error(f"Missing required columns in CSV: {missing_columns}")
        log.info(f"Columns available: {list(df.columns)}")
        return

    # Rename columns to match database expectations
    df = df.rename(columns=column_mapping)

    engine = get_engine()
    
    with engine.connect() as conn:
        log.info("Connected to database.")
        
        # 1. Handle Platforms
        unique_platforms = df['platform'].unique()
        log.info(f"Processing {len(unique_platforms)} platforms...")
        
        for platform in unique_platforms:
            insert_stmt = text("""
                INSERT INTO platforms (name) 
                VALUES (:name) 
                ON CONFLICT (name) DO NOTHING
            """)
            conn.execute(insert_stmt, {"name": platform})
        conn.commit()
        
        # Fetch platform mapping
        platform_map = pd.read_sql("SELECT name, platform_id FROM platforms", conn)
        platform_dict = dict(zip(platform_map['name'], platform_map['platform_id']))
        
        # 2. Handle Assets
        # Try to infer asset type if not present, otherwise default to 'Unknown' or NULL logic
        # For this script we will treat ticker as the primary identifier.
        # Note: Schema has UNIQUE(ticker, asset_type). 
        # We will assume a default type 'Stock' for ingestion if not provided to avoid dupes on NULL.
        
        unique_tickers = df['ticker'].unique()
        log.info(f"Processing {len(unique_tickers)} assets...")
        
        for ticker in unique_tickers:
            # We use a simple insert on conflict do nothing assuming 'Stock' type for simplicity 
            # or we could just check if it exists.
            # Schema allows multiple same tickers if types differ.
            # This script simplifies to: insert if ticker doesn't exist (ignoring type nuance for now).
            
            # Better approach given the UNIQUE(ticker, asset_type) constraint:
            # Always insert with a fixed type 'Stock' if we don't know it, to ensure uniqueness logic works cleanly.
            
            insert_stmt = text("""
                INSERT INTO assets (ticker, asset_type) 
                VALUES (:ticker, 'Stock') 
                ON CONFLICT (ticker, asset_type) DO NOTHING
            """)
            conn.execute(insert_stmt, {"ticker": ticker})
        conn.commit()

        # Fetch asset mapping (assuming type 'Stock' for all our ingested ones)
        asset_query = text("SELECT ticker, asset_id FROM assets WHERE asset_type = 'Stock'")
        asset_map = pd.read_sql(asset_query, conn)
        asset_dict = dict(zip(asset_map['ticker'], asset_map['asset_id']))

        # 3. Prepare 'asset_mentions' data
        log.info("preparing final dataset...")
        
        # Map IDs
        df['platform_id'] = df['platform'].map(platform_dict)
        df['asset_id'] = df['ticker'].map(asset_dict)
        
        # Drop rows where mapping failed (shouldn't happen with above logic but safe to check)
        entry_count_before = len(df)
        df_clean = df.dropna(subset=['platform_id', 'asset_id'])
        if len(df_clean) < entry_count_before:
            log.warning(f"Dropped {entry_count_before - len(df_clean)} rows due to mapping failures.")

        # Select cols for insertion
        mentions_data = df_clean[['asset_id', 'platform_id', 'sentiment_score', 'confidence_level', 'created_at']]
        
        log.info(f"Inserting {len(mentions_data)} records into asset_mentions...")
        mentions_data.to_sql('asset_mentions', engine, if_exists='append', index=False, chunksize=1000)
        
        log.info("Data ingestion complete!")

if __name__ == "__main__":
    from config import SENTIMENT_ANALYSIS_OUTPUT_PATH
    ingest_data(SENTIMENT_ANALYSIS_OUTPUT_PATH)
