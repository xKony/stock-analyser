import asyncio
import os
import json
import argparse
import random
import pandas as pd
from pathlib import Path
from typing import List, Optional

from data.reddit_client import RedditClient
from data.data_handler import DataHandler

from data.reddit_client import RedditClient
from data.data_handler import DataHandler
from LLM.factory import get_llm_client
# MistralClient import removed, now using factory
from config import (
    LLM_INPUT_DIR, 
    LLM_OUTPUT_DIR, 
    SENTIMENT_ANALYSIS_OUTPUT_PATH, 
    KEEP_LLM_INPUT, 
    KEEP_LLM_OUTPUT,
    SUBREDDIT_LIST
)
from utils.logger import get_logger
from utils.json_parser import parse_llm_json_to_df

log = get_logger(__name__)


async def _run_scraping_phase(test_subreddit: Optional[str] = None) -> None:
    """Handles the Reddit scraping phase."""
    log.info("Phase 1: Fetching Reddit Data...")
    reddit_client = RedditClient()
    data_handler = DataHandler()
    
    try:
        async for sub_name, data in reddit_client.process_all_subreddits(
            sort_by="top", limit=20, subreddits=[test_subreddit] if test_subreddit else None
        ):
            data_handler.save_subreddit_data(sub_name, data)
            
    except Exception as e:
        log.error(f"Error during data scraping: {e}")
        # We might want to re-raise if scraping failure should stop the whole pipeline
        # For now, we log and return, which might allow partial processing if some data exists
    finally:
        await reddit_client.close()
        
    try:
        # Convert JSON to JSON-JSON for LLM
        # Run heavy synchronous file processing in a separate thread
        log.info("Processing collected data files...")
        await asyncio.to_thread(data_handler.process_files_to_json)
    except Exception as e:
        log.error(f"Error processing files to JSON: {e}")

def _read_file_sync(file_path: Path) -> str:
    """Helper for reading file synchronously."""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

async def process_input_file(
    file_path: Path, client: "Any", output_dir: Path, platform_name: str = "Other"
) -> List[pd.DataFrame]:
    """
    Reads a single input file, sends it to the LLM, parses the result.
    Returns a list containing the dataframe if successful, else empty.
    """
    results = []
    try:
        log.info(f"Processing file: {file_path.name}")
        
        # Use asyncio.to_thread to make file reading non-blocking
        try:
             content = await asyncio.to_thread(_read_file_sync, file_path)
        except Exception as e:
             log.error(f"Failed to read file {file_path.name}: {e}")
             return results

        if not content:
            log.warning(f"File {file_path.name} is empty. Skipping.")
            return results

        # MistralClient/GeminiClient now returns a List[Dict] (or None)
        json_data = await client.get_response(content)
        
        if json_data:
            df = parse_llm_json_to_df(json_data)
            
            if df is not None and not df.empty:
                df['created_at'] = pd.Timestamp.now()
                df['Platform'] = platform_name
                
                results.append(df)
                
                # Save individual analysis for debugging
                output_file = output_dir / f"{file_path.stem}_analysis.csv"
                # DataFrame.to_csv is also blocking, offload it
                await asyncio.to_thread(df.to_csv, output_file, index=False)
                log.info(f"Saved individual analysis to: {output_file}")
            else:
                 log.warning(f"Failed to convert data to DataFrame for {file_path.name}")
        else:
            log.error(f"No valid response received for {file_path.name}")

    except Exception as e:
        log.error(f"Error processing {file_path.name}: {e}")
    
    return results


async def _run_llm_analysis_phase(input_dir: Path, output_dir: Path) -> List[pd.DataFrame]:
    """Handles the LLM analysis phase."""
    log.info("Phase 2: Running LLM Analysis...")
    
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
        log.critical(f"Failed to initialize LLM Client: {e}")
        return []

    current_platform = getattr(RedditClient, "SOURCE_NAME", "Other")

    all_dfs = []
    for file_path in json_files:
        dfs = await process_input_file(file_path, client, output_dir, platform_name=current_platform)
        all_dfs.extend(dfs)
    
    return all_dfs


def _cleanup_directories(input_dir: Path, output_dir: Path) -> None:
    """Handles cleanup of temporary directories."""
    if not KEEP_LLM_INPUT and input_dir.exists():
        log.info(f"Cleaning up LLM Input directory: {input_dir}")
        try:
            for item in input_dir.iterdir():
                if item.is_file():
                    item.unlink()
        except Exception as e:
            log.error(f"Error cleaning LLM input: {e}")

    if not KEEP_LLM_OUTPUT and output_dir.exists():
        log.info(f"Cleaning up LLM Output directory: {output_dir}")
        try:
            for item in output_dir.iterdir():
                if item.is_file():
                    item.unlink()
        except Exception as e:
            log.error(f"Error cleaning LLM output: {e}")


async def run_full_pipeline(test_subreddit: Optional[str] = None) -> None:
    """
    Orchestrates the full pipeline: Scrape -> Processing -> LLM -> CSV.
    """
    log.info("Starting Full Pipeline...")
    
    # 1. Scrape
    await _run_scraping_phase(test_subreddit)

    # 2. LLM Analysis
    input_dir = Path(LLM_INPUT_DIR)
    output_dir = Path(LLM_OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    all_dfs = await _run_llm_analysis_phase(input_dir, output_dir)
    
    # 3. Aggregate and Save
    if all_dfs:
        final_df = pd.concat(all_dfs, ignore_index=True)
        final_df.to_csv(SENTIMENT_ANALYSIS_OUTPUT_PATH, index=False)
        log.info(f"Full pipeline complete. Data saved to {SENTIMENT_ANALYSIS_OUTPUT_PATH}")
        
        # 4. Insert into Supabase
        try:
            from database.supabase_client import SupabaseClient
            db_client = SupabaseClient()
            
            # Convert DataFrame to list of dicts for insertion
            # We need to ensure types are compatible (numpy types to python types)
            records = final_df.to_dict(orient='records')
            
            # Identify platform source (defaulting to Reddit for now as main.py is reddit-centric)
            # ideally this should come from the data or context
            platform_name = getattr(RedditClient, "SOURCE_NAME", "Reddit")
            
            log.info(f"Inserting {len(records)} records into Supabase...")
            db_client.insert_analysis(records, platform_name)
            
        except Exception as e:
            log.error(f"Failed to insert data into Supabase: {e}")

    else:
        log.warning("No data was generated in the pipeline.")

    # 4. Cleanup
    _cleanup_directories(input_dir, output_dir)


def run_parse_only(input_file: str) -> None:
    """
    Runs only the parsing logic on a given input file containing raw LLM output.
    """
    log.info(f"Running Parse-Only mode on file: {input_file}")
    
    if not os.path.exists(input_file):
        log.error(f"Input file not found: {input_file}")
        return

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        
        try:
            data = json.loads(raw_content)
            df = parse_llm_json_to_df(data)
        except json.JSONDecodeError as e:
            log.error(f"Failed to decode JSON from file: {e}")
            return
        
        if df is not None:
             if 'created_at' not in df.columns:
                 df['created_at'] = pd.Timestamp.now()
             if 'Platform' not in df.columns:
                 df['Platform'] = 'Other'

             df.to_csv(SENTIMENT_ANALYSIS_OUTPUT_PATH, index=False)
             log.info(f"Parsed data saved to {SENTIMENT_ANALYSIS_OUTPUT_PATH}")
        else:
            log.error("Failed to parse the input file.")

    except Exception as e:
        log.error(f"Error in parse-only mode: {e}")


async def async_main() -> None:
    parser = argparse.ArgumentParser(description="Stock Sentiment Analysis Pipeline")
    parser.add_argument(
        "--parse-only", 
        type=str, 
        help="Path to a raw output file to parse. Bypasses scraping and API querying."
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode: Process only one random subreddit."
    )
    
    args = parser.parse_args()

    if args.parse_only:
        run_parse_only(args.parse_only)
    else:
        test_subreddit = None
        if args.test:
            test_subreddit = random.choice(SUBREDDIT_LIST)
            log.info(f"Test mode enabled. Selected random subreddit: {test_subreddit}")
        
        await run_full_pipeline(test_subreddit=test_subreddit)


if __name__ == "__main__":
    asyncio.run(async_main())
