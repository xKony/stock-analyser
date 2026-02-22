import asyncio
import argparse
import json
import random
from pathlib import Path
from typing import List, Optional

from data.data_handler import DataHandler
from data.models import SentimentRecord
from data.reddit_client import RedditClient
from database.supabase_client import SupabaseClient
from LLM.base_llm import validate_stock_sentiment_json
from LLM.factory import get_llm_client
from config import (
    KEEP_LLM_INPUT,
    KEEP_LLM_OUTPUT,
    LLM_INPUT_DIR,
    LLM_OUTPUT_DIR,
    SUBREDDIT_LIST,
)
from utils.logger import get_logger

log = get_logger(__name__)


# ---------------------------------------------------------------------------
# Pipeline phases
# ---------------------------------------------------------------------------

async def _run_scraping_phase(test_subreddit: Optional[str] = None) -> None:
    """Scrape Reddit and convert raw JSON to LLM-ready JSON files."""
    log.info("Phase 1: Fetching Reddit data...")
    reddit_client = RedditClient()
    data_handler = DataHandler()

    try:
        async for sub_name, data in reddit_client.process_all_subreddits(
            sort_by="top",
            limit=20,
            subreddits=[test_subreddit] if test_subreddit else None,
        ):
            data_handler.save_subreddit_data(sub_name, data)
    except Exception as e:
        log.error(f"Error during data scraping: {e}")
    finally:
        await reddit_client.close()

    try:
        log.info("Processing collected data files...")
        await asyncio.to_thread(data_handler.process_files_to_json)
    except Exception as e:
        log.error(f"Error processing files to JSON: {e}")


async def _process_single_file(
    file_path: Path,
    client: Any,
) -> List[Dict[str, Any]]:
    """Send one JSON file to the LLM and return validated sentiment records.

    Returns:
        A list of validated sentiment dicts, or an empty list on failure.
    """
    log.info(f"Processing file: {file_path.name}")

    try:
        content = await asyncio.to_thread(file_path.read_text, encoding="utf-8")
    except OSError as e:
        log.error(f"Failed to read {file_path.name}: {e}")
        return []

    if not content.strip():
        log.warning(f"File {file_path.name} is empty. Skipping.")
        return []

    result = await client.get_response(content)
    if result is None:
        log.error(f"No valid response received for {file_path.name}")
        return []

    # Stamp each record with deduplication keys:
    # - source_id: the filename (unique per scrape batch)
    # - source_name: the platform (e.g. 'Reddit') — differentiates IDs across
    #   future platforms (Twitter, SeekingAlpha, etc.) so they never collide.
    platform = getattr(RedditClient, "SOURCE_NAME", "unknown").lower()
    for record in result:
        record.source_id = file_path.name
        record.source_name = platform

    return result


async def _run_llm_analysis_phase(
    input_dir: Path,
) -> List[SentimentRecord]:
    """Run LLM analysis on all JSON files in *input_dir*.

    Returns:
        Aggregated list of :class:`~data.models.SentimentRecord` from all files.
    """
    log.info("Phase 2: Running LLM analysis...")

    if not input_dir.exists():
        log.error(f"Input directory not found: {input_dir}")
        return []

    json_files: List[Path] = list(input_dir.glob("*.json"))
    if not json_files:
        log.warning("No JSON files found for analysis.")
        return []

    try:
        client = get_llm_client()
    except Exception as e:
        log.critical(f"Failed to initialise LLM client: {e}")
        return []

    # Fire all LLM calls concurrently. The RateLimiter inside each client
    # serialises requests at the API level when the RPM window is full,
    # so gather is safe — it just removes sequential Python overhead.
    tasks = [
        _process_single_file(file_path, client)
        for file_path in json_files
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_records: List[SentimentRecord] = []
    for file_path, result in zip(json_files, results):
        if isinstance(result, Exception):
            log.error(f"LLM call failed for {file_path.name}: {result}")
        elif result:
            all_records.extend(result)

    return all_records


def _cleanup_directories(input_dir: Path, output_dir: Path) -> None:
    """Delete temporary files from *input_dir* and *output_dir* if configured."""
    for keep_flag, directory, label in [
        (KEEP_LLM_INPUT, input_dir, "LLM input"),
        (KEEP_LLM_OUTPUT, output_dir, "LLM output"),
    ]:
        if not keep_flag and directory.exists():
            log.info(f"Cleaning up {label} directory: {directory}")
            try:
                for item in directory.iterdir():
                    if item.is_file():
                        item.unlink()
            except Exception as e:
                log.error(f"Error cleaning {label} directory: {e}")


# ---------------------------------------------------------------------------
# Top-level pipeline entry points
# ---------------------------------------------------------------------------

async def run_full_pipeline(test_subreddit: Optional[str] = None) -> None:
    """Orchestrate the full pipeline: Scrape → LLM → Supabase."""
    log.info("Starting full pipeline...")

    # Phase 1: Scrape
    await _run_scraping_phase(test_subreddit)

    # Phase 2: LLM analysis
    input_dir = Path(LLM_INPUT_DIR)
    output_dir = Path(LLM_OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_records = await _run_llm_analysis_phase(input_dir)

    # Phase 3: Persist to Supabase
    if all_records:
        log.info(f"Pipeline produced {len(all_records)} records. Inserting into Supabase...")
        try:
            db_client = SupabaseClient()
            platform_name: str = getattr(RedditClient, "SOURCE_NAME", "Reddit")
            db_client.insert_analysis(all_records, platform_name)
        except Exception as e:
            log.error(f"Failed to insert data into Supabase: {e}")
    else:
        log.warning("No data was generated in the pipeline.")

    # Phase 4: Cleanup
    _cleanup_directories(input_dir, output_dir)


def run_parse_only(input_file: str) -> None:
    """Parse a raw JSON file of LLM output and insert it into Supabase.

    Useful for re-processing a saved LLM response without re-running the
    full scraping and analysis pipeline.
    """
    log.info(f"Running parse-only mode on file: {input_file}")
    file_path = Path(input_file)

    if not file_path.exists():
        log.error(f"Input file not found: {input_file}")
        return

    try:
        raw_content = file_path.read_text(encoding="utf-8")
        data = json.loads(raw_content)
    except (OSError, json.JSONDecodeError) as e:
        log.error(f"Failed to read or decode JSON from '{input_file}': {e}")
        return

    records = validate_stock_sentiment_json(data)
    if not records:
        log.error("No valid records found in the input file.")
        return

    try:
        db_client = SupabaseClient()
        db_client.insert_analysis(records, platform_name="Other")
        log.info(f"Inserted {len(records)} records from '{input_file}' into Supabase.")
    except Exception as e:
        log.error(f"Failed to insert parsed data into Supabase: {e}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

async def async_main() -> None:
    parser = argparse.ArgumentParser(description="Stock Sentiment Analysis Pipeline")
    parser.add_argument(
        "--parse-only",
        type=str,
        metavar="FILE",
        help="Path to a raw LLM JSON output file. Bypasses scraping and API querying.",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode: process only one randomly chosen subreddit.",
    )

    args = parser.parse_args()

    if args.parse_only:
        run_parse_only(args.parse_only)
    else:
        test_subreddit: Optional[str] = None
        if args.test:
            test_subreddit = random.choice(SUBREDDIT_LIST)
            log.info(f"Test mode enabled. Selected subreddit: {test_subreddit}")

        await run_full_pipeline(test_subreddit=test_subreddit)


if __name__ == "__main__":
    asyncio.run(async_main())
