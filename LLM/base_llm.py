import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from utils.logger import get_logger
from utils.rate_limiter import RateLimiter
from utils.llm_utils import load_prompt, validate_stock_sentiment_json

log = get_logger(__name__)

class BaseLLM(ABC):
    def __init__(self, provider_name: str, model_name: str, rpm: int, rpd: int):
        self.provider_name = provider_name
        self.model_name = model_name
        self.rate_limiter = RateLimiter(provider_name, rpm, rpd)
        
        try:
            self.system_prompt = load_prompt()
        except FileNotFoundError:
            log.critical("System prompt file missing. Client initialization failed.")
            raise
        except Exception as e:
            log.critical(f"Failed to initialize {provider_name} Client: {e}")
            raise

    @abstractmethod
    async def _get_response_raw(self, prompt: str) -> Any:
        """
        Abstract method to get raw response from the LLM provider.
        Must be implemented by subclasses.
        """
        pass

    @abstractmethod
    def _parse_response(self, response: Any) -> Optional[str]:
        """
        Abstract method to parse the raw response into a string.
        Must be implemented by subclasses.
        """
        pass

    async def get_response(self, input_text: str) -> Optional[List[Dict[str, Any]]]:
        """
        Common logic for getting response, parsing, and validating.
        """
        log.info(f"Starting response generation sequence for {self.provider_name}...")

        # Call API
        raw_response = await self._get_response_raw(input_text)

        if raw_response:
            # Extract raw content string
            content_str = self._parse_response(raw_response)
            
            if not content_str:
                return None
            
            # LOG RAW RESPONSE for debugging
            log.debug(f"RAW LLM RESPONSE ({self.provider_name}):\n{content_str}")

            # Parse JSON
            try:
                # remove markdown code fences if present
                clean_str = content_str.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_str)
                
                # Validate the structure
                valid_data = validate_stock_sentiment_json(data)
                
                log.info(f"Generated and validated {len(valid_data)} items successfully.")
                return valid_data
                
            except json.JSONDecodeError as e:
                log.error(f"Failed to decode JSON from LLM response: {e}")
                log.debug(f"Failed Content: {content_str}")
                return None
            except Exception as e:
                log.error(f"Unexpected error during JSON processing: {e}")
                return None
        else:
            log.error("Response generation failed (No raw response).")
            return None
