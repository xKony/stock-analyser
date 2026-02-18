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

    def _clean_text(self, text: str, max_length: int = 0) -> str:
        if not text:
            return ""

        # Remove emojis and special characters
        if REMOVE_NON_ASCII:
            text = self.ascii_pattern.sub("", text)

        # " ".join(split()) is the fastest way to normalize whitespace in Python
        cleaned = " ".join(text.split())
        
        if max_length > 0 and len(cleaned) > max_length:
            return cleaned[:max_length] + "..."
            
        return cleaned

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
        title = self._clean_text(post_data.get("title") or "")
        
        selftext_val = post_data.get("selftext") or post_data.get("body") or ""
        selftext = self._clean_text(selftext_val, max_length=1000)

        comments = post_data.get("comments", [])
        valid_comments = [c for c in comments if c.get("body")]
        top_comments = valid_comments[:max_comments]

        optimized_comments = []
        for comment in top_comments:
            c_body = self._clean_text(comment.get("body", ""), max_length=max_chars)
            
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

        log.info(f"Scanning {len(json_files)} files for processing...")

        # Removed: Cleanup of existing files in input dir (to allow incremental build)
        # for input_file in self.llm_input_dir.glob("*.json"): ...

        merged_file_path = self.llm_input_dir / "FULL_CONTEXT.json"
        
        # If merging is enabled, we might need to purge the merged file to rebuild it
        # Or typically we rebuild it from the incremental files.
        if MERGE_LLM_OUTPUT:
             if merged_file_path.exists():
                 try:
                     merged_file_path.unlink()
                 except Exception: 
                     pass

        merged_buffer = []
        processed_count = 0
        skipped_count = 0

        for file_path in json_files:
            try:
                # 1:1 mapping: stocks_2024.json -> stocks_2024.json in llm_input
                target_json_path = self.llm_input_dir / file_path.name
                
                # Check if already processed
                if target_json_path.exists() and not MERGE_LLM_OUTPUT:
                    # If merging is ON, we might need to read it to merge, 
                    # but if merging is OFF, we can fully skip.
                    # For now, let's assume if it exists, it's valid.
                    skipped_count += 1
                    continue

                # Load Raw Data
                with open(file_path, "r", encoding="utf-8") as f:
                    content = json.load(f)

                subreddit = content.get("meta", {}).get("subreddit", "unknown")
                posts = content.get("data", [])

                file_buffer = []
                for post in posts:
                    file_buffer.append(self.optimize_for_llm(post))

                if MERGE_LLM_OUTPUT:
                    merged_buffer.extend(file_buffer)
                
                # If NOT merging, or even if merging (to keep individual cache), save the file
                # Saving individual files allows skipping them next time even if merge is on (we'd just read processed file)
                # But to keep logic simple for this refactor:
                if file_buffer:
                    with open(target_json_path, "w", encoding="utf-8") as f_out:
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

        if MERGE_LLM_OUTPUT and merged_buffer:
             with open(merged_file_path, "w", encoding="utf-8") as f_out:
                json.dump(merged_buffer, f_out, ensure_ascii=False, indent=2)
             log.info(f"Merged {len(merged_buffer)} items into {merged_file_path}")

        log.info(f"Processing complete. Processed: {processed_count}, Skipped: {skipped_count}.")
