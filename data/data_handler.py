import json
import os
import re
from datetime import datetime
from pathlib import Path
from utils.logger import get_logger
from config import (
    DATA_OUTPUT_DIR,
    LLM_INPUT_DIR,
    KEEP_RAW_JSON,
    MERGE_LLM_OUTPUT,
    REMOVE_NON_ASCII,
    COMMENT_LIMIT,
)

log = get_logger(__name__)


class DataHandler:
    def __init__(self):
        self.output_dir: Path = Path(DATA_OUTPUT_DIR)
        self.llm_input_dir: Path = Path(LLM_INPUT_DIR)
        self.ascii_pattern = re.compile(r"[^\x00-\x7F]+")

        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
            self.llm_input_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            log.error(f"Failed to create storage directory: {e}")
            raise

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""

        # Remove emojis and special characters
        if REMOVE_NON_ASCII:
            text = self.ascii_pattern.sub("", text)

        # " ".join(split()) is the fastest way to normalize whitespace in Python
        return " ".join(text.split())

    def save_subreddit_data(self, subreddit_name: str, posts_data: list):
        if not posts_data:
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

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=4, ensure_ascii=False)
            log.info(f"Saved JSON: {file_path}")
        except IOError as e:
            log.error(f"Failed to write data to {file_path}: {e}")

    def optimize_for_llm(
        self, post_data: dict, max_comments: int = COMMENT_LIMIT, max_chars: int = 500
    ) -> dict:
        # Clean inputs
        title = self._clean_text(post_data.get("title", ""))
        selftext = self._clean_text(
            post_data.get("selftext", "") or post_data.get("body", "")
        )
        if len(selftext) > 1000:
             selftext = selftext[:1000] + "..."

        comments = post_data.get("comments", [])
        valid_comments = [c for c in comments if c.get("body")]
        top_comments = valid_comments[:max_comments]

        optimized_comments = []
        for comment in top_comments:
            c_body = self._clean_text(comment.get("body", ""))
            if len(c_body) > max_chars:
                c_body = c_body[:max_chars] + "..."
            
            optimized_comments.append({
                "body": c_body,
                "score": comment.get("score", 0)
            })

        return {
            "title": title,
            "selftext": selftext,
            "score": post_data.get("score", 0),
            "comments": optimized_comments
        }

    def process_files_to_json(self):
        json_files: list = list(self.output_dir.glob("*.json"))

        if not json_files:
            log.warning(f"No JSON files found in {self.output_dir}")
            return

        log.info(f"Processing {len(json_files)} files...")

        # Clean existing JSON files in input dir to prevent stale data
        for input_file in self.llm_input_dir.glob("*.json"):
            try:
                input_file.unlink()
            except OSError as e:
                log.warning(f"Could not delete stale file {input_file}: {e}")

        merged_file_path = self.llm_input_dir / "FULL_CONTEXT.json"

        if MERGE_LLM_OUTPUT and merged_file_path.exists():
            try:
                os.remove(merged_file_path)
            except OSError:
                pass

        processed_count = 0

        for file_path in json_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = json.load(f)

                subreddit = content.get("meta", {}).get("subreddit", "unknown")
                posts = content.get("data", [])

                if MERGE_LLM_OUTPUT:
                    target_json_path = merged_file_path
                else:
                    target_json_path = self.llm_input_dir / f"{subreddit}.json"

                file_buffer = []

                for post in posts:
                    file_buffer.append(self.optimize_for_llm(post))

                if file_buffer:
                    with open(target_json_path, "w", encoding="utf-8") as f_out:
                        # Dump the whole list as a JSON array
                        json.dump(file_buffer, f_out, ensure_ascii=False, indent=2)

                processed_count += 1

                if not KEEP_RAW_JSON:
                    try:
                        file_path.unlink()
                        log.debug(f"Deleted raw JSON: {file_path.name}")
                    except OSError as e:
                        log.warning(f"Could not delete {file_path.name}: {e}")

            except json.JSONDecodeError:
                log.error(f"Skipping invalid JSON: {file_path}")
            except Exception as e:
                log.error(f"Error processing {file_path}: {e}")

        log.info(f"Done. Processed {processed_count} files.")
