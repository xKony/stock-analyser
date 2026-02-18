import os
from typing import List, Dict, Any, Optional
from config import PROMPT_FILE
from utils.logger import get_logger

log = get_logger(__name__)

def load_prompt(prompt_path: str = PROMPT_FILE) -> str:
    """
    Loads the system prompt from the specified file path.
    """
    log.debug(f"Attempting to load prompt from: {prompt_path}")
    try:
        if not os.path.exists(prompt_path):
            log.error(f"Prompt file not found at path: {prompt_path}")
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

        with open(prompt_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

        if not content:
            log.warning(f"Prompt file exists but is empty: {prompt_path}")
            return ""

        log.info(f"Successfully loaded prompt ({len(content)} chars)")
        return content

    except FileNotFoundError:
        raise
    except Exception as e:
        log.error(f"Error loading prompt file: {e}")
        raise

def validate_stock_sentiment_json(data: Any) -> List[Dict[str, Any]]:
    """
    Validates that the output is a list of dictionaries with required stock sentiment keys.
    Handles single dict responses by wrapping them in a list.
    """
    # Handle case where LLM returns a single object instead of a list
    if isinstance(data, dict):
            log.warning("Received single dict, wrapping in list.")
            data = [data]

    if not isinstance(data, list):
        log.warning(f"Expected list of objects, got {type(data)}")
        return []
        
    valid_items = []
    required_keys = {"symbol", "sentiment_score", "sentiment_confidence", "sentiment_label", "key_rationale"}
    
    for item in data:
        if not isinstance(item, dict):
            continue
            
        # Check keys
        if not required_keys.issubset(item.keys()):
            log.warning(f"Skipping item missing keys: {item}")
            continue
            
        # Basic Type/Range Checks
        try:
            score = float(item.get("sentiment_score", 0.0))
            if not (-1.0 <= score <= 1.0):
                    log.warning(f"Score out of range: {score}")
            
            conf = float(item.get("sentiment_confidence", 0.0))
            if not (0.0 <= conf <= 1.0):
                    log.warning(f"Confidence out of range: {conf}")
                    
            valid_items.append(item)
        except (ValueError, TypeError):
            log.warning(f"Invalid numeric values in item: {item}")
            continue
            
    return valid_items
