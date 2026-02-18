import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from config import PROMPT_FILE, DEFAULT_GEMINI_MODEL
from utils.logger import get_logger
from typing import Optional, List, Dict, Any
from utils.rate_limiter import RateLimiter

load_dotenv()
log = get_logger(__name__)


def _load_prompt(prompt_path: str = PROMPT_FILE) -> str:
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


class GeminiClient:
    def __init__(self, model: str = DEFAULT_GEMINI_MODEL, rpm: int = 15, rpd: int = 1500):
        # Mask API key in logs for security
        api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        if not api_key:
            log.error("Environment variable GEMINI_API_KEY not set.")
            return

        masked_key = (
            f"****{api_key[-4:]}"
            if api_key and len(api_key) > 8
            else "INVALID"
        )
        log.debug(f"Initializing Gemini Client. Model: {model}, Key: {masked_key}, RPM: {rpm}, RPD: {rpd}")

        genai.configure(api_key=api_key)
        self.model_name = model
        self.model = genai.GenerativeModel(model_name=model)
        self.rate_limiter = RateLimiter("gemini", rpm, rpd)
        
        try:
            self.system_prompt = _load_prompt()
        except FileNotFoundError:
            log.critical("System prompt file missing. Client initialization failed.")
            raise
        except Exception as e:
            log.critical(
                f"Failed to initialize Gemini Client due to prompt loading error: {e}"
            )
            raise e

        log.info("Gemini Client initialized successfully.")

    async def get_response_raw(self, prompt: str):
        # Check rate limits before making request
        await self.rate_limiter.check_and_acquire()
        
        log.info(f"Sending request to Gemini model ({self.model_name})...")
        try:
            # Configure safety settings to be less restrictive for financial analysis content if needed
            # as market discussions can sometimes trigger false positives
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }

            # Prepend the system prompt to the user message
            full_prompt = f"{self.system_prompt}\n\nUSER INPUT:\n{prompt}"
            
            response = await self.model.generate_content_async(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    candidate_count=1,
                    temperature=0.2, # Low temp for deterministic extraction
                    response_mime_type="application/json" # Enforce JSON output
                ),
                safety_settings=safety_settings
            )
            
            if response is None:
                log.error("Received None response from Gemini API.")
            else:
                log.debug("Received raw response from Gemini API.")
            return response
        except Exception as e:
            log.error(f"Gemini API interaction failed: {e}")
            return None

    def parse_response(self, response) -> Optional[str]:
        if response is None:
            log.warning("Cannot parse None response.")
            return None

        try:
            return response.text
        except Exception as e:
            log.error(f"Failed parsing Gemini response object: {e}", exc_info=True)
            return None

    def _validate_json_output(self, data: Any) -> list:
        """
        Validates that the output is a list of dictionaries with required keys.
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

    async def get_response(self, input_text: str) -> Optional[List[Dict[str, Any]]]:
        log.info("Starting response generation sequence...")

        # Call API
        raw_response = await self.get_response_raw(input_text)

        if raw_response:
            # Extract raw content string
            content_str = self.parse_response(raw_response)
            
            if not content_str:
                return None
            
            # LOG RAW RESPONSE for debugging
            log.debug(f"RAW LLM RESPONSE:\n{content_str}")

            # Parse JSON
            try:
                # remove markdown code fences if present (Gemini might still add them even if JSON mime type is used)
                clean_str = content_str.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_str)
                
                # Validate the structure
                valid_data = self._validate_json_output(data)
                
                log.info(f"Generated and validated {len(valid_data)} items successfully.")
                return valid_data # Return python list of dicts directly
                
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