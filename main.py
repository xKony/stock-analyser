import asyncio
import os
from pathlib import Path
from typing import List

from data.reddit_client import RedditClient
from data.data_handler import DataHandler
from LLM.mistral_client import Mistral_Client
from config import LLM_INPUT_DIR, LLM_OUTPUT_DIR
from utils.logger import get_logger

log = get_logger(__name__)


def get_subreddit_data() -> None:
    """
    Scrapes data from subreddits and processes it into text files.
    """
    reddit_client = RedditClient()
    data_handler = DataHandler()
    
    # Process subreddits
    for sub_name, data in reddit_client.process_all_subreddits(
        sort_by="top", limit=20
    ):
        data_handler.save_subreddit_data(sub_name, data)
        
    # Convert JSON to TXT for LLM
    data_handler.process_files_to_txt()


async def process_input_file(
    file_path: Path, client: Mistral_Client, output_dir: Path
) -> None:
    """
    Reads a single input file, sends it to the LLM, and saves the result.
    """
    try:
        log.info(f"Processing file: {file_path.name}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if not content:
            log.warning(f"File {file_path.name} is empty. Skipping.")
            return

        response = await client.get_response(content)
        
        if response:
            output_file = output_dir / f"{file_path.stem}_analysis.csv"
            with open(output_file, "w", encoding="utf-8") as f_out:
                f_out.write(response)
            log.info(f"Saved analysis to: {output_file}")
        else:
            log.error(f"No response received for {file_path.name}")

    except Exception as e:
        log.error(f"Error processing {file_path.name}: {e}")


async def run_llm_analysis() -> None:
    """
    Orchestrates the LLM analysis process: finds files, initializes client, runs requests.
    """
    input_dir = Path(LLM_INPUT_DIR)
    output_dir = Path(LLM_OUTPUT_DIR)
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check inputs
    if not input_dir.exists():
        log.error(f"Input directory not found: {LLM_INPUT_DIR}")
        return

    txt_files: List[Path] = list(input_dir.glob("*.txt"))
    if not txt_files:
        log.warning("No text files found for analysis.")
        return

    # Initialize Client
    try:
        client = Mistral_Client()
    except Exception as e:
        log.critical(f"Failed to initialize Mistral Client: {e}")
        return

    # Process files (could be done concurrently with asyncio.gather if desired)
    # For now, sequential to respect rate limits potentially, or gather if we want speed.
    # Let's use sequential for safety unless specified otherwise.
    for file_path in txt_files:
        await process_input_file(file_path, client, output_dir)


async def async_main() -> None:
    """
    Async entry point for the application.
    """
    log.info("Starting application...")
    
    # 1. Scrape and prepare data (Synchronous blocking call)
    # We run this in a thread if we wanted true non-blocking, but it's fine here to block.
    log.info("Phase 1: Fetching Reddit Data...")
    try:
        get_subreddit_data()
    except Exception as e:
        log.error(f"Error during data fetching: {e}")
        return

    # 2. Run LLM Analysis
    log.info("Phase 2: Running LLM Analysis...")
    await run_llm_analysis()
    
    log.info("Application finished successfully.")


if __name__ == "__main__":
    asyncio.run(async_main())
