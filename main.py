import asyncio
import os
import argparse
import shutil
import random
import pandas as pd
from pathlib import Path
from typing import List

from data.reddit_client import RedditClient
from data.data_handler import DataHandler
from LLM.mistral_client import Mistral_Client
from config import (
    LLM_INPUT_DIR, 
    LLM_OUTPUT_DIR, 
    SENTIMENT_ANALYSIS_OUTPUT_PATH, 
    KEEP_LLM_INPUT, 
    KEEP_LLM_OUTPUT,
    SUBREDDIT_LIST
)
from utils.logger import get_logger
from utils.csv_parser import parse_llm_output_to_csv

log = get_logger(__name__)

async def get_subreddit_data(subreddits: List[str] = None) -> None:
    """
    Scrapes data from subreddits and processes it into text files.
    """
    reddit_client = RedditClient()
    data_handler = DataHandler()
    
    try:
        # Process subreddits
        async for sub_name, data in reddit_client.process_all_subreddits(
            sort_by="top", limit=20, subreddits=subreddits
        ):
            data_handler.save_subreddit_data(sub_name, data)
    finally:
        await reddit_client.close()
        
    # Convert JSON to TXT for LLM
    data_handler.process_files_to_txt()


async def process_input_file(
    file_path: Path, client: Mistral_Client, output_dir: Path, platform_name: str = "Other"
) -> List[pd.DataFrame]:
    """
    Reads a single input file, sends it to the LLM, parses the result.
    Returns a list containing the dataframe if successful, else empty.
    """
    results = []
    try:
        log.info(f"Processing file: {file_path.name}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if not content:
            log.warning(f"File {file_path.name} is empty. Skipping.")
            return results

        response = await client.get_response(content)
        
        if response:
            # Parse the response
            df = parse_llm_output_to_csv(response)
            
            if df is not None and not df.empty:
                # Add metadata (optional but helpful)
                df['created_at'] = pd.Timestamp.now()
                df['Platform'] = platform_name
                
                results.append(df)
                
                # Save individual raw output/analysis if needed (optional based on updated requirement, 
                # but good for debugging/traceability)
                output_file = output_dir / f"{file_path.stem}_analysis.csv"
                df.to_csv(output_file, index=False)
                log.info(f"Saved individual analysis to: {output_file}")
            else:
                 log.warning(f"Failed to parse response for {file_path.name}")

        else:
            log.error(f"No response received for {file_path.name}")

    except Exception as e:
        log.error(f"Error processing {file_path.name}: {e}")
    
    return results


async def run_full_pipeline(test_subreddit: str = None) -> None:
    """
    Runs the full pipeline: Scrape -> Processing -> LLM -> CSV.
    """
    log.info("Starting Full Pipeline...")
    
    # 1. Scrape (Blocking to ensure data is ready)
    log.info("Phase 1: Fetching Reddit Data...")
    try:
        subreddits = [test_subreddit] if test_subreddit else None
        await get_subreddit_data(subreddits=subreddits)
    except Exception as e:
        log.error(f"Error during data fetching: {e}")
        return

    # 2. LLM Analysis
    log.info("Phase 2: Running LLM Analysis...")
    input_dir = Path(LLM_INPUT_DIR)
    output_dir = Path(LLM_OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not input_dir.exists():
        log.error(f"Input directory not found: {LLM_INPUT_DIR}")
        return

    txt_files: List[Path] = list(input_dir.glob("*.txt"))
    if not txt_files:
        log.warning("No text files found for analysis.")
        return

    try:
        client = Mistral_Client()
    except Exception as e:
        log.critical(f"Failed to initialize Mistral Client: {e}")
        return

    # Determine platform source
    # Since we are running the full pipeline using RedditClient, we use its defined source name.
    current_platform = getattr(RedditClient, "SOURCE_NAME", "Other")

    all_dfs = []
    for file_path in txt_files:
        dfs = await process_input_file(file_path, client, output_dir, platform_name=current_platform)
        all_dfs.extend(dfs)
    
    # 3. Aggregate and Save
    if all_dfs:
        final_df = pd.concat(all_dfs, ignore_index=True)
        final_df.to_csv(SENTIMENT_ANALYSIS_OUTPUT_PATH, index=False)
        log.info(f"Full pipeline complete. Data saved to {SENTIMENT_ANALYSIS_OUTPUT_PATH}")
    else:
        log.warning("No data was generated in the pipeline.")

    # 4. Cleanup
    if not KEEP_LLM_INPUT:
        log.info(f"Cleaning up LLM Input directory: {input_dir}")
        try:
            for item in input_dir.iterdir():
                if item.is_file():
                    item.unlink()
        except Exception as e:
            log.error(f"Error cleaning LLM input: {e}")

    if not KEEP_LLM_OUTPUT:
        log.info(f"Cleaning up LLM Output directory: {output_dir}")
        try:
            for item in output_dir.iterdir():
                if item.is_file():
                    item.unlink()
        except Exception as e:
            log.error(f"Error cleaning LLM output: {e}")


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
        
        df = parse_llm_output_to_csv(raw_content)
        
        if df is not None:
             # Add default metadata if missing
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
