import os
from typing import Any, Optional

from google import genai
from google.genai import types

from config import LLM_PROVIDERS
from LLM.base_llm import BaseLLM
from utils.logger import get_logger

log = get_logger(__name__)


class GeminiClient(BaseLLM):
    """LLM client for Google Gemini models."""

    def __init__(
        self,
        model: str = LLM_PROVIDERS["gemini"]["model_name"],
        rpm: int = 15,
        rpd: int = 1500,
    ) -> None:
        api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        if not api_key:
            log.error("Environment variable GEMINI_API_KEY not set.")
            raise ValueError("GEMINI_API_KEY not set")

        # super().__init__ must be called before _mask_api_key is available as
        # an instance method, so we call the static version directly.
        masked_key = BaseLLM._mask_api_key(api_key)
        log.debug(
            f"Initialising Gemini client. Model: {model}, Key: {masked_key}, "
            f"RPM: {rpm}, RPD: {rpd}"
        )

        try:
            super().__init__("gemini", model, rpm, rpd)
            self.client = genai.Client(api_key=api_key)
        except Exception as e:
            log.critical(f"Failed to initialise Gemini client: {e}")
            raise

        log.info("Gemini client initialised successfully.")

    async def _get_response_raw(self, prompt: str) -> Any:
        await self.rate_limiter.check_and_acquire()

        log.info(f"Sending request to Gemini model ({self.model_name})...")
        try:
            safety_settings = [
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]

            full_prompt = f"{self.system_prompt}\n\nUSER INPUT:\n{prompt}"

            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    candidate_count=1,
                    temperature=0.2,
                    response_mime_type="application/json",
                    safety_settings=safety_settings,
                ),
            )

            if response is None:
                log.error("Received None response from Gemini API.")
                return None

            if not response.candidates:
                log.warning("Gemini response blocked or empty.")
                if response.prompt_feedback:
                    log.warning(f"Prompt feedback: {response.prompt_feedback}")
                return None

            log.debug("Received raw response from Gemini API.")
            return response

        except Exception as e:
            log.error(f"Gemini API interaction failed: {e}")
            return None

    def _parse_response(self, response: Any) -> Optional[str]:
        try:
            return response.text
        except ValueError as e:
            log.warning(f"Failed to access response text (likely safety block): {e}")
            return None
        except Exception as e:
            log.error(f"Failed parsing Gemini response object: {e}", exc_info=True)
            return None
