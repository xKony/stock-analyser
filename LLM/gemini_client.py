import os
from google import genai
from google.genai import types
from config import LLM_PROVIDERS
from utils.logger import get_logger
from typing import Optional, Any
from LLM.base_llm import BaseLLM

log = get_logger(__name__)


class GeminiClient(BaseLLM):
    def __init__(self, model: str = LLM_PROVIDERS["gemini"]["model_name"], rpm: int = 15, rpd: int = 1500):
        # Mask API key in logs for security
        api_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        if not api_key:
            log.error("Environment variable GEMINI_API_KEY not set.")
            raise ValueError("GEMINI_API_KEY not set")

        masked_key = (
            f"****{api_key[-4:]}"
            if api_key and len(api_key) > 8
            else "INVALID"
        )
        log.debug(f"Initializing Gemini Client. Model: {model}, Key: {masked_key}, RPM: {rpm}, RPD: {rpd}")

        try:
            super().__init__("gemini", model, rpm, rpd)
            self.client = genai.Client(api_key=api_key)
        except Exception as e:
            log.critical(
                f"Failed to initialize Gemini Client: {e}"
            )
            # Re-raise unless it was already raised by super
            raise e

        log.info("Gemini Client initialized successfully.")

    async def _get_response_raw(self, prompt: str) -> Any:
        # Check rate limits before making request
        await self.rate_limiter.check_and_acquire()
        
        log.info(f"Sending request to Gemini model ({self.model_name})...")
        try:
            # Configure safety settings
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
            
            # Use async generate_content from the client
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    candidate_count=1,
                    temperature=0.2,
                    response_mime_type="application/json",
                    safety_settings=safety_settings
                )
            )
            
            if response is None:
                log.error("Received None response from Gemini API.")
                return None
            
            # Check for safety blocks or empty content
            if not response.candidates:
                 log.warning("Gemini response blocked or empty logic.")
                 if response.prompt_feedback:
                      log.warning(f"Prompt Feedback: {response.prompt_feedback}")
                 return None

            log.debug("Received raw response from Gemini API.")
            return response
        except Exception as e:
            log.error(f"Gemini API interaction failed: {e}")
            return None

    def _parse_response(self, response: Any) -> Optional[str]:
        # response is guaranteed to be truthy by BaseLLM.get_response
        try:
            return response.text
        except ValueError as ve:
             # This catches "Response was blocked by safety settings" if .text accessor fails
             log.warning(f"Failed to access response text (likely safety block): {ve}")
             return None
        except Exception as e:
            log.error(f"Failed parsing Gemini response object: {e}", exc_info=True)
            return None
