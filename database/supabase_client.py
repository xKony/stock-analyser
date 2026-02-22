from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from supabase import Client, create_client

from config import SUPABASE_KEY, SUPABASE_URL
from data.models import SentimentRecord
from utils.logger import get_logger

log = get_logger(__name__)


class SupabaseClient:
    """Handles all database interactions with Supabase."""

    def __init__(self) -> None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            log.critical("SUPABASE_URL or SUPABASE_KEY not set in environment or config.")
            raise ValueError("Missing Supabase configuration.")

        try:
            self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            log.info("Supabase client initialised successfully.")
        except Exception as e:
            log.critical(f"Failed to initialise Supabase client: {e}")
            raise

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_query(self, table: str, criteria: Dict[str, Any]):
        """Build a chainable Supabase select query filtered by *criteria*."""
        query = self.client.table(table).select("*")
        for key, value in criteria.items():
            query = query.eq(key, value)
        return query

    def _get_or_create(
        self,
        table: str,
        search_criteria: Dict[str, Any],
        insert_data: Dict[str, Any],
        id_column: str,
    ) -> Optional[int]:
        """Retrieve the ID of an existing record or create a new one.

        Args:
            table:           Target Supabase table name.
            search_criteria: Column/value pairs used to look up the record.
            insert_data:     Data to insert if the record does not exist.
            id_column:       Name of the primary-key column to return.

        Returns:
            The integer ID of the found or created record, or *None* on error.
        """
        try:
            response = self._build_query(table, search_criteria).execute()

            if response.data:
                return response.data[0].get(id_column)

            # Record not found — attempt insert.
            try:
                insert_response = self.client.table(table).insert(insert_data).execute()
                if insert_response.data:
                    log.info(f"Created new record in '{table}': {insert_data}")
                    return insert_response.data[0].get(id_column)
            except Exception as insert_error:
                # Handle race condition: another process may have inserted first.
                log.warning(
                    f"Insert failed for '{table}', retrying fetch: {insert_error}"
                )
                retry_response = self._build_query(table, search_criteria).execute()
                if retry_response.data:
                    return retry_response.data[0].get(id_column)
                raise insert_error

        except Exception as e:
            log.error(f"Error managing record in '{table}': {e}")
        return None

    def _prefetch_asset_ids(self, tickers: List[str]) -> Dict[str, int]:
        """Fetch all known asset IDs for *tickers* in a single SELECT query.

        Returns:
            A mapping of ``ticker → asset_id`` for all tickers already in the DB.
        """
        if not tickers:
            return {}
        try:
            response = (
                self.client.table("assets")
                .select("ticker, asset_id")
                .in_("ticker", tickers)
                .execute()
            )
            return {row["ticker"]: row["asset_id"] for row in (response.data or [])}
        except Exception as e:
            log.warning(f"Pre-fetch of asset IDs failed, falling back to per-item lookup: {e}")
            return {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def insert_analysis(
        self, records: List[SentimentRecord], platform_name: str
    ) -> None:
        """Batch-insert LLM analysis results into Supabase.

        Args:
            records:       Validated :class:`~data.models.SentimentRecord` objects.
            platform_name: Source label (e.g. ``'Reddit/stocks'``).
        """
        if not records:
            return

        platform_id = self._get_or_create(
            table="platforms",
            search_criteria={"name": platform_name},
            insert_data={"name": platform_name},
            id_column="platform_id",
        )

        if not platform_id:
            log.error(
                f"Could not resolve platform_id for '{platform_name}'. Skipping batch."
            )
            return

        # Pre-fetch all known tickers in a single round-trip.
        unique_tickers = list({r.symbol for r in records})
        asset_id_cache: Dict[str, int] = self._prefetch_asset_ids(unique_tickers)

        # Insert any tickers not yet in the DB.
        for ticker in unique_tickers:
            if ticker not in asset_id_cache:
                asset_id = self._get_or_create(
                    table="assets",
                    search_criteria={"ticker": ticker, "asset_type": "Stock"},
                    insert_data={"ticker": ticker, "asset_type": "Stock"},
                    id_column="asset_id",
                )
                if asset_id:
                    asset_id_cache[ticker] = asset_id

        # Build the batch payload.
        batch_mentions: List[Dict[str, Any]] = []
        log.info(f"Preparing batch insert for {len(records)} records...")

        for record in records:
            asset_id = asset_id_cache.get(record.symbol)
            if not asset_id:
                log.warning(f"Could not resolve asset_id for '{record.symbol}'. Skipping.")
                continue

            batch_mentions.append({
                "asset_id": asset_id,
                "platform_id": platform_id,
                "sentiment_score": record.sentiment_score,
                "confidence_level": record.sentiment_confidence,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

        if not batch_mentions:
            log.warning("No valid records to insert after processing.")
            return

        try:
            self.client.table("asset_mentions").insert(batch_mentions).execute()
            log.info(f"Successfully inserted {len(batch_mentions)} records to Supabase.")
        except Exception as e:
            log.error(f"Failed to execute batch insert: {e}")

    # ------------------------------------------------------------------
    # Post deduplication
    # ------------------------------------------------------------------

    def get_processed_post_ids(self, source_name: str) -> set:
        """Return the set of post IDs already analysed for *source_name*.

        Called once before scraping so the reddit client can filter out
        posts that have already been processed in a previous run.

        Args:
            source_name: Platform label, e.g. ``'reddit'``.

        Returns:
            A :class:`set` of post ID strings (empty if none found).
        """
        try:
            response = (
                self.client.table("processed_posts")
                .select("post_id")
                .eq("source_name", source_name)
                .execute()
            )
            ids = {row["post_id"] for row in (response.data or [])}
            log.info(f"Fetched {len(ids)} processed post IDs for '{source_name}'.")
            return ids
        except Exception as e:
            log.error(f"Failed to fetch processed post IDs: {e}")
            return set()

    def mark_posts_processed(self, post_ids: List[str], source_name: str) -> None:
        """Record *post_ids* as processed so they are skipped on future runs.

        Uses upsert with ``ignore_duplicates=True`` so re-inserting an
        already-known ID is a silent no-op.

        Args:
            post_ids:    Reddit (or other platform) post ID strings.
            source_name: Platform label, e.g. ``'reddit'``.
        """
        if not post_ids:
            return

        rows = [
            {"post_id": pid, "source_name": source_name}
            for pid in post_ids
        ]
        try:
            self.client.table("processed_posts").upsert(
                rows,
                on_conflict="post_id,source_name",
                ignore_duplicates=True,
            ).execute()
            log.info(f"Marked {len(rows)} posts as processed for '{source_name}'.")
        except Exception as e:
            log.error(f"Failed to mark posts as processed: {e}")
