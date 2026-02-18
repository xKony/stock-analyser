import pandas as pd
from sqlalchemy import create_engine, text, Engine, Connection
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
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


def get_engine() -> Engine:
    return create_engine(DATABASE_URL)


def _read_and_process_csv(file_path: str) -> Optional[pd.DataFrame]:
    """Reads and validates the CSV file."""
    if not os.path.exists(file_path):
        log.error(f"File not found: {file_path}")
        return None

    log.info(f"Reading data from {file_path}...")
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        log.error(f"File not found during read: {file_path}")
        return None
    except pd.errors.EmptyDataError:
        log.error(f"File is empty: {file_path}")
        return None
    except Exception as e:
        log.error(f"Failed to read CSV: {e}")
        return None

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

    # Check for required columns
    required_columns = list(column_mapping.keys())
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        log.error(f"Missing required columns in CSV: {missing_columns}")
        log.info(f"Columns available: {list(df.columns)}")
        return None

    # Rename columns
    df = df.rename(columns=column_mapping)
    return df


def _db_insert_platforms(conn: Connection, platforms: List[str]) -> None:
    """Inserts new platforms into the database."""
    if not platforms:
        return

    log.info(f"Processing {len(platforms)} platforms...")
    # Use executemany equivalent via parameter list if possible, or simple loop with conflict handling
    # For ON CONFLICT DO NOTHING, simple execution is safe.
    # Bulk optimization: We could construct one query, but for low cardinality (platforms), loop is acceptable.
    # However, to strictly follow guidelines, let's vectorise/batch if possible. 
    # Since SQL doesn't support vectorised insert easily without specific drivers, we stick to cleaner loops or construct a VALUES list.
    
    insert_stmt = text("""
        INSERT INTO platforms (name) 
        VALUES (:name) 
        ON CONFLICT (name) DO NOTHING
    """)
    
    # SQLAlchemy execute can take a list of dicts for bulk execution
    params = [{"name": p} for p in platforms]
    try:
        conn.execute(insert_stmt, params)
    except Exception as e:
        log.error(f"Error inserting platforms: {e}")
        raise


def _db_get_platform_map(conn: Connection) -> Dict[str, int]:
    """Fetches text-to-id mapping for platforms."""
    try:
        df = pd.read_sql("SELECT name, platform_id FROM platforms", conn)
        return dict(zip(df['name'], df['platform_id']))
    except Exception as e:
        log.error(f"Error fetching platform map: {e}")
        raise


def _db_insert_assets(conn: Connection, tickers: List[str]) -> None:
    """Inserts new assets (stocks) into the database."""
    if not tickers:
        return

    log.info(f"Processing {len(tickers)} assets...")
    
    insert_stmt = text("""
        INSERT INTO assets (ticker, asset_type) 
        VALUES (:ticker, 'Stock') 
        ON CONFLICT (ticker, asset_type) DO NOTHING
    """)
    
    params = [{"ticker": t} for t in tickers]
    try:
        conn.execute(insert_stmt, params)
    except Exception as e:
        log.error(f"Error inserting assets: {e}")
        raise


def _db_get_asset_map(conn: Connection) -> Dict[str, int]:
    """Fetches text-to-id mapping for assets (Stocks only)."""
    try:
        query = text("SELECT ticker, asset_id FROM assets WHERE asset_type = 'Stock'")
        df = pd.read_sql(query, conn)
        return dict(zip(df['ticker'], df['asset_id']))
    except Exception as e:
        log.error(f"Error fetching asset map: {e}")
        raise


def _db_insert_mentions(conn: Connection, df: pd.DataFrame, platform_map: Dict[str, int], asset_map: Dict[str, int], engine: Engine) -> None:
    """Prepares and bulk inserts mentions data."""
    log.info("Preparing final dataset...")

    # Map IDs
    # distinct copy to avoid SettingWithCopy warning on the original df if it was a slice
    df_mapped = df.copy()
    try:
        df_mapped['platform_id'] = df_mapped['platform'].map(platform_map)
        df_mapped['asset_id'] = df_mapped['ticker'].map(asset_map)
    except Exception as e:
        log.error(f"Error mapping IDs: {e}")
        return

    # Drop rows where mapping failed
    entry_count_before = len(df_mapped)
    df_clean = df_mapped.dropna(subset=['platform_id', 'asset_id'])
    
    dropped_count = entry_count_before - len(df_clean)
    if dropped_count > 0:
        log.warning(f"Dropped {dropped_count} rows due to mapping failures.")

    if df_clean.empty:
        log.warning("No valid records to insert after mapping.")
        return

    # Select cols for insertion
    mentions_data = df_clean[['asset_id', 'platform_id', 'sentiment_score', 'confidence_level', 'created_at']]

    log.info(f"Inserting {len(mentions_data)} records into asset_mentions...")
    try:
        # Check against existing to avoid duplicates if needed, but 'asset_mentions' might not have a unique constraint on all these fields.
        # Assuming append is safe or handled by DB.
        mentions_data.to_sql('asset_mentions', engine, if_exists='append', index=False, chunksize=1000)
        log.info("Data ingestion complete!")
    except Exception as e:
        log.error(f"Error during bulk insert: {e}")
        raise


def ingest_data(file_path: str) -> None:
    """Main coordinator function for data ingestion."""
    df = _read_and_process_csv(file_path)
    if df is None:
        return

    engine = get_engine()
    
    try:
        with engine.begin() as conn: # Use begin() for transaction management
            log.info("Connected to database.")
            
            # 1. Handle Platforms
            unique_platforms = df['platform'].unique().tolist()
            _db_insert_platforms(conn, unique_platforms)
            platform_map = _db_get_platform_map(conn)
            
            # 2. Handle Assets
            unique_tickers = df['ticker'].unique().tolist()
            _db_insert_assets(conn, unique_tickers)
            asset_map = _db_get_asset_map(conn)
            
            # 3. Handle Mentions
            # Note: to_sql typically requires an engine or connection. 
            # If using connection inside a transaction (engine.begin), we need to be careful with pandas transaction handling.
            # Pandas to_sql can take a connection.
            _db_insert_mentions(conn, df, platform_map, asset_map, engine) # Passing engine might be safer for to_sql auto-transaction if conn fails
            
            # Note: _db_insert_mentions uses to_sql with 'engine' in previous logic, but here we are in a transaction 'conn'.
            # Passing 'conn' to to_sql is better to stay in same transaction.
            pass

    except Exception as e:
        log.error(f"Ingestion process failed: {e}")
        # Transaction will auto-rollback due to 'with engine.begin()' context manager if exception raised.


if __name__ == "__main__":
    from config import SENTIMENT_ANALYSIS_OUTPUT_PATH
    ingest_data(SENTIMENT_ANALYSIS_OUTPUT_PATH)
