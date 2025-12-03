import json
import os
from datetime import datetime
from pathlib import Path
from utils.logger import get_logger
from config import DATA_OUTPUT_DIR, LLM_INPUT_DIR

log = get_logger(__name__)


class DataHandler:
    def __init__(self):
        self.output_dir: Path = Path(DATA_OUTPUT_DIR)
        self.llm_input_dir: Path = Path(LLM_INPUT_DIR)
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        try:
            # Create both directories
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self.llm_input_dir.mkdir(parents=True, exist_ok=True)
            log.info(
                f"Storage directories verified:\n - Raw: {self.output_dir}\n - LLM: {self.llm_input_dir}"
            )
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

    def optimize_for_llm(
        self, post_data: dict, max_comments: int = 5, max_chars: int = 500
    ) -> str:
        title: str = post_data.get("title", "").replace("\n", " ")
        score: str = post_data.get("score", 0)
        selftext: str = " ".join(post_data.get("selftext", "").strip().split())

        text_block = f"## POST (Score: {score})\nTITLE: {title}\n"

        if selftext:
            if len(selftext) > 1000:
                selftext = selftext[:1000] + "...(truncated)"
            text_block += f"BODY: {selftext}\n"

        text_block += "## COMMENTS\n"

        # 2. Format the Comments
        # Sort by score descending (just in case they aren't already)
        # This ensures the LLM reads the "best" comments first
        comments = post_data.get("comments", [])

        # Filter out comments with no body
        valid_comments = [c for c in comments if c.get("body")]

        # Take only the top N comments
        top_comments = valid_comments[:max_comments]

        if not top_comments:
            text_block += "(No comments)\n"

        for i, comment in enumerate(top_comments, 1):
            c_score = comment.get("score", 0)
            c_body = comment.get("body", "").replace("\n", " ")

            if len(c_body) > max_chars:
                c_body = c_body[:max_chars] + "..."

            # Format: "1. [Score] Comment text"
            text_block += f"{i}. [{c_score}] {c_body}\n"

        return text_block

    def process_files_to_txt(self):
        json_files: list = list(self.output_dir.glob("*.json"))

        if not json_files:
            log.warning(f"No JSON files found in {self.output_dir}")
            return

        log.info(f"Found {len(json_files)} JSON files. Beginning conversion to TXT...")

        # Clear/Create a set to track which subreddits we are processing in this run
        # (Optional: You might want to delete old txt files here if you want a fresh start)

        processed_count = 0

        for file_path in json_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = json.load(f)

                subreddit = content.get("meta", {}).get("subreddit", "unknown")
                posts = content.get("data", [])

                # Define the target TXT file for this subreddit
                txt_filename = f"{subreddit}_llm_input.txt"
                txt_path = self.llm_input_dir / txt_filename

                # Open in APPEND mode ('a') so multiple JSONs for the same subreddit
                # get combined into one big text file.
                with open(txt_path, "a", encoding="utf-8") as f_out:
                    for post in posts:
                        optimized_text = self.optimize_for_llm(post)

                        # Write the text block + a separator line
                        f_out.write(optimized_text)
                        f_out.write("\n")

                processed_count += 1
                log.debug(f"Appended {len(posts)} posts to {txt_filename}")

            except json.JSONDecodeError:
                log.error(f"Skipping file (invalid JSON): {file_path}")
            except Exception as e:
                log.error(f"Error processing {file_path}: {e}")

        log.info(
            f"Finished processing {processed_count} files. Check {self.llm_input_dir} for output."
        )
