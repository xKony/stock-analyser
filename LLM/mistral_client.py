import os
from mistralai import Mistral
from mistralai.models import UserMessage, SystemMessage
from config import LLM_PROVIDERS
from utils.logger import get_logger
from typing import Optional, Any
from LLM.base_llm import BaseLLM

log = get_logger(__name__)


class MistralClient(BaseLLM):
    def __init__(self, model: str = LLM_PROVIDERS["mistral"]["model_name"], rpm: int = 60, rpd: int = 1000):
        # Mask API key in logs for security
        api_key: Optional[str] = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            log.error("Environment variable MISTRAL_API_KEY not set.")
            raise ValueError("MISTRAL_API_KEY not set")
            
        masked_key = (
            f"****{api_key[-4:]}"
            if api_key and len(api_key) > 8
            else "INVALID"
        )
        log.debug(f"Initializing Mistral Client. Model: {model}, Key: {masked_key}, RPM: {rpm}, RPD: {rpd}")

        try:
            super().__init__("mistral", model, rpm, rpd)
            self.client = Mistral(api_key=api_key)
        except Exception as e:
            log.critical(
                f"Failed to initialize Mistral Client: {e}"
            )
            # Re-raise unless it was already raised by super
            raise e

        log.info("Mistral Client initialized successfully.")

    async def _get_response_raw(self, prompt: str) -> Any:
        # Check rate limits
        await self.rate_limiter.check_and_acquire()

        log.info(f"Sending request to Mistral model ({self.model_name})...")
        
        # Construct messages with System Instruction
        messages = [
            SystemMessage(content=self.system_prompt),
            UserMessage(content=prompt),
        ]
        
        try:
            response = await self.client.chat.complete_async(
                model=self.model_name, messages=messages
            )
            if response is None:
                log.error("Received None response from Mistral API.")
            else:
                log.debug("Received raw response from Mistral API.")
            return response
        except Exception as e:
            # MistralAI exception hierarchy is not fully exposed in types here, 
            # so we keep Exception but log it clearly as an API interaction error.
            log.error(f"Mistral API interaction failed: {e}")
            return None

    def _parse_response(self, response: Any) -> Optional[str]:
        if response is None:
            log.warning("Cannot parse None response.")
            return None

        content = None
        try:
            # 1. Try standard object attribute access (Choices)
            if hasattr(response, "choices"):
                choices = getattr(response, "choices")
                if choices:
                    first = choices[0]
                    if hasattr(first, "message") and hasattr(first.message, "content"):
                        content = first.message.content
                    elif isinstance(first, dict):
                        content = first.get("message", {}).get("content")

            # 2. Fallback to output_text or text
            if not content:
                if hasattr(response, "output_text"):
                    content = getattr(response, "output_text")
                elif hasattr(response, "text"):
                    content = getattr(response, "text")

            # 3. Last resort: String conversion (unlikely to be valid JSON if we fall here)
            if content is None:
                content = str(response)

            return content

        except Exception as e:
            log.error(f"Failed parsing Mistral response object: {e}", exc_info=True)
            return None

