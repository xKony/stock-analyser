import pandas as pd
from sqlalchemy import create_engine, text
import sys
from pathlib import Path

# Add project root to sys.path to allow importing utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.logger import get_logger

log = get_logger(__name__)

# Database Configuration (ensure matches ingest script)
DB_USER = os.getenv('POSTGRES_USER', 'user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')
DB_HOST = 'localhost'
DB_PORT = '5432'
DB_NAME = os.getenv('POSTGRES_DB', 'stock_db')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def main():
    log.info("Connecting to database...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            query = text("""
                SELECT 
                    am.mention_id, 
                    a.ticker, 
                    p.name as platform, 
                    am.sentiment_score, 
                    am.confidence_level,
                    am.created_at
                FROM asset_mentions am
                JOIN assets a ON am.asset_id = a.asset_id
                JOIN platforms p ON am.platform_id = p.platform_id
                ORDER BY am.created_at DESC
                LIMIT 10;
            """)
            
            result = pd.read_sql(query, conn)
            
            if result.empty:
                log.warning("No data found in database!")
            else:
                log.info("\nTop 10 most recent entries:")

                log.info(f"\n{result.to_string(index=False)}")

                
    except Exception as e:
        log.error(f"Error connecting or querying database: {e}")
        log.info("Ensure Docker container is running: 'docker-compose up -d'")

if __name__ == "__main__":
    main()
