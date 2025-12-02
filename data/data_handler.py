import json
import os
from datetime import datetime
from pathlib import Path
from utils.logger import get_logger
from config import DATA_OUTPUT_DIR

log = get_logger(__name__)


class DataHandler:
    def __init__(self):
        self.output_dir = Path(DATA_OUTPUT_DIR)
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            log.info(f"Data storage directory verified at: {self.output_dir}")
        except Exception as e:
            log.error(f"Failed to create storage directory: {e}")
            raise

    def save_subreddit_data(self, subreddit_name: str, posts_data: list):
        if not posts_data:
            log.warning(f"No data to save for subreddit: {subreddit_name}")
            return

        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M")
        filename = f"{subreddit_name}_{timestamp_str}.json"
        file_path = self.output_dir / filename

        # 2. Prepare the final structure (Adding Metadata)
        # It's good practice to wrap the data with metadata about the scrape.
        payload = {
            "meta": {
                "subreddit": subreddit_name,
                "scraped_at": datetime.now().isoformat(),
                "count": len(posts_data),
            },
            "data": posts_data,
        }

        # 3. Write to JSON
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=4, ensure_ascii=False)

            log.info(f"Successfully saved {len(posts_data)} posts to {file_path}")
        except IOError as e:
            log.error(f"Failed to write data to {file_path}: {e}")
