import json
import os
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from data.models import SentimentRecord
from utils.logger import get_logger
from utils.rate_limiter import RateLimiter
from config import PROMPT_FILE

log = get_logger(__name__)

def load_prompt(prompt_path: str = PROMPT_FILE) -> str:
    """Loads the system prompt from *prompt_path*.

    Raises:
        FileNotFoundError: If the prompt file does not exist.
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
    """Validates that *data* is a list of well-formed stock-sentiment dicts.

    Handles the case where the LLM returns a single object instead of a list
    by wrapping it automatically.

    Returns:
        A list containing only the items that pass all validation checks.
    """
    if isinstance(data, dict):
        log.warning("Received single dict from LLM; wrapping in list.")
        data = [data]

    if not isinstance(data, list):
        log.warning(f"Expected list of objects, got {type(data)}")
        return []

    required_keys: set = {
        "symbol",
        "sentiment_score",
        "sentiment_confidence",
        "sentiment_label",
        "key_rationale",
    }

    valid_items: List[Dict[str, Any]] = []

    for item in data:
        if not isinstance(item, dict):
            continue

        if not required_keys.issubset(item.keys()):
            log.warning(f"Skipping item missing required keys: {item}")
            continue

        try:
            score = float(item["sentiment_score"])
            if not (-1.0 <= score <= 1.0):
                log.warning(f"Sentiment score out of range: {score}")

            conf = float(item["sentiment_confidence"])
            if not (0.0 <= conf <= 1.0):
                log.warning(f"Sentiment confidence out of range: {conf}")

            valid_items.append(item)
        except (ValueError, TypeError):
            log.warning(f"Invalid numeric values in item: {item}")

    return valid_items


# ---------------------------------------------------------------------------
# Abstract base class
# ---------------------------------------------------------------------------

class BaseLLM(ABC):
    """Abstract base for all LLM provider clients.

    Subclasses must implement :meth:`_get_response_raw` and
    :meth:`_parse_response`.  Common orchestration (rate limiting, JSON
    parsing, validation) lives here.
    """

    def __init__(
        self,
        provider_name: str,
        model_name: str,
        rpm: int,
        rpd: int,
    ) -> None:
        self.provider_name = provider_name
        self.model_name = model_name
        self.rate_limiter = RateLimiter(provider_name, rpm, rpd)

        try:
            self.system_prompt: str = load_prompt()
        except FileNotFoundError:
            log.critical("System prompt file missing. Client initialisation failed.")
            raise
        except Exception as e:
            log.critical(f"Failed to initialise {provider_name} client: {e}")
            raise

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _mask_api_key(api_key: str) -> str:
        """Returns a partially masked representation of *api_key* for safe logging."""
        if api_key and len(api_key) > 8:
            return f"****{api_key[-4:]}"
        return "INVALID"

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    async def _get_response_raw(self, prompt: str) -> Any:
        """Send *prompt* to the provider and return the raw response object."""

    @abstractmethod
    def _parse_response(self, response: Any) -> Optional[str]:
        """Extract the text content from a raw provider response."""

    # ------------------------------------------------------------------
    # Common pipeline
    # ------------------------------------------------------------------

    async def get_response(self, input_text: str) -> Optional[List[SentimentRecord]]:
        """Orchestrate a full request: rate-limit → call → parse → validate → coerce.

        Returns:
            A validated list of :class:`~data.models.SentimentRecord` objects,
            or *None* on any failure.
        """
        log.info(f"Starting response generation for {self.provider_name}...")

        raw_response = await self._get_response_raw(input_text)

        if not raw_response:
            log.error("Response generation failed (no raw response).")
            return None

        content_str = self._parse_response(raw_response)
        if not content_str:
            return None

        log.debug(f"RAW LLM RESPONSE ({self.provider_name}):\n{content_str}")

        try:
            # Strip markdown code fences robustly.
            # Handles: ```json, ```JSON, ```, any trailing tag, surrounding whitespace.
            clean_str = re.sub(
                r"^\s*```[a-zA-Z]*\s*|\s*```\s*$",
                "",
                content_str,
                flags=re.DOTALL,
            ).strip()
            data = json.loads(clean_str)
            valid_data = validate_stock_sentiment_json(data)

            # Coerce each validated dict into the canonical SentimentRecord type.
            records: List[SentimentRecord] = []
            for item in valid_data:
                try:
                    records.append(SentimentRecord.from_dict(item))
                except (KeyError, ValueError, TypeError) as exc:
                    log.warning(f"Dropping item that failed SentimentRecord coercion: {exc} — {item}")

            log.info(f"Produced {len(records)} SentimentRecord(s) from {self.provider_name}.")
            return records

        except json.JSONDecodeError as e:
            log.error(f"Failed to decode JSON from LLM response: {e}")
            log.debug(f"Failed content: {content_str}")
            return None
        except Exception as e:
            log.error(f"Unexpected error during JSON processing: {e}")
            return None
