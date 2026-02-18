import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
from utils.logger import get_logger

log = get_logger(__name__)

class SupabaseClient:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            log.critical("SUPABASE_URL or SUPABASE_KEY not set in environment or config.")
            raise ValueError("Missing Supabase configuration.")
            
        try:
            self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            log.info("Supabase Client initialized successfully.")
        except Exception as e:
            log.critical(f"Failed to initialize Supabase Client: {e}")
            raise

    def _get_or_create(self, table: str, search_criteria: dict, insert_data: dict) -> Optional[int]:
        """
        Generic method to retrieve an ID or create a new record if it doesn't exist.
        """
        try:
            # Check if exists
            query = self.client.table(table).select("*")
            for key, value in search_criteria.items():
                query = query.eq(key, value)
            
            response = query.execute()
            
            # Assuming the ID column is named '{table_singular}_id' or similar, 
            # but simpler to just return the ID from the first record if we know the schema.
            # Platforms -> platform_id, Assets -> asset_id. 
            # We can infer ID column name or just grab the first key that looks like an ID,
            # OR pass ID column name. 
            # Let's simple check:
            id_column = f"{table[:-1]}_id" # companies -> company_id, platforms -> platform_id
            
            if response.data:
                return response.data[0].get(id_column)
            
            # Insert logic
            try:
                response = self.client.table(table).insert(insert_data).execute()
                if response.data:
                    log.info(f"Created new record in {table}: {insert_data}")
                    return response.data[0].get(id_column)
            except Exception as insert_error:
                # Race condition check
                log.warning(f"Insert failed for {table}, retrying fetch: {insert_error}")
                
                # Re-fetch
                query = self.client.table(table).select("*")
                for key, value in search_criteria.items():
                    query = query.eq(key, value)
                response = query.execute()
                
                if response.data:
                    return response.data[0].get(id_column)
                else:
                    raise insert_error

        except Exception as e:
            log.error(f"Error managing record in '{table}': {e}")
        return None

    def insert_analysis(self, analysis_data: List[Dict[str, Any]], platform_name: str):
        """
        Inserts a list of analysis results into the database efficiently using batch inserts.
        
        Args:
            analysis_data: List of dicts containing keys: symbol, sentiment_score, sentiment_confidence
            platform_name: Source of the data (e.g., 'Reddit/stocks')
        """
        if not analysis_data:
            return

        platform_id = self._get_or_create(
            "platforms", 
            {"name": platform_name}, 
            {"name": platform_name}
        )
        
        if not platform_id:
            log.error(f"Could not resolve platform_id for {platform_name}. Skipping batch.")
            return

        # Local cache for asset IDs to avoid repeated lookups in the same batch
        asset_id_cache = {} 
        batch_mentions = []
        
        log.info(f"Preparing batch insert for {len(analysis_data)} records...")

        for item in analysis_data:
            # Handle both lowercase (LLM raw) and Title Case (DataFrame) keys
            ticker = item.get("symbol") or item.get("Symbol")
            if not ticker: 
                continue

            # Check cache first
            if ticker in asset_id_cache:
                asset_id = asset_id_cache[ticker]
            else:
                asset_type = "Stock" # Default for now
                asset_id = self._get_or_create(
                    "assets",
                    {"ticker": ticker, "asset_type": asset_type},
                    {"ticker": ticker, "asset_type": asset_type}
                )
                if asset_id:
                    asset_id_cache[ticker] = asset_id
            
            if not asset_id:
                log.warning(f"Could not resolve asset_id for {ticker}. Skipping item.")
                continue

            try:
                score = item.get("sentiment_score")
                if score is None:
                    score = item.get("Sentiment_Score")
                
                confidence = item.get("sentiment_confidence")
                if confidence is None:
                    confidence = item.get("Sentiment_Confidence")

                mention_data = {
                    "asset_id": asset_id,
                    "platform_id": platform_id,
                    "sentiment_score": score,
                    "confidence_level": confidence,
                    "created_at": datetime.now().isoformat()
                }
                
                batch_mentions.append(mention_data)
                
            except Exception as e:
                log.error(f"Failed to process item for {ticker}: {e}")

        if batch_mentions:
            try:
                # Supabase/PostgREST supports list for bulk insert
                self.client.table("asset_mentions").insert(batch_mentions).execute()
                log.info(f"Successfully batch inserted {len(batch_mentions)} records to Supabase.")
            except Exception as e:
                log.error(f"Failed to execute batch insert: {e}")
        else:
            log.warning("No valid records to insert after processing.")
