import os
from typing import Any, Optional

from dotenv import load_dotenv
from mistralai import Mistral
from mistralai.models import SystemMessage, UserMessage

from config import LLM_PROVIDERS
from LLM.base_llm import BaseLLM
from utils.logger import get_logger

load_dotenv()
log = get_logger(__name__)


class MistralClient(BaseLLM):
    """LLM client for Mistral AI models."""

    def __init__(
        self,
        model: str = LLM_PROVIDERS["mistral"]["model_name"],
        rpm: int = 60,
        rpd: int = 1000,
    ) -> None:
        api_key: Optional[str] = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            log.error("Environment variable MISTRAL_API_KEY not set.")
            raise ValueError("MISTRAL_API_KEY not set")

        masked_key = BaseLLM._mask_api_key(api_key)
        log.debug(
            f"Initialising Mistral client. Model: {model}, Key: {masked_key}, "
            f"RPM: {rpm}, RPD: {rpd}"
        )

        try:
            super().__init__("mistral", model, rpm, rpd)
            self.client = Mistral(api_key=api_key)
        except Exception as e:
            log.critical(f"Failed to initialise Mistral client: {e}")
            raise

        log.info("Mistral client initialised successfully.")

    async def _get_response_raw(self, prompt: str) -> Any:
        await self.rate_limiter.check_and_acquire()

        log.info(f"Sending request to Mistral model ({self.model_name})...")
        messages = [
            SystemMessage(content=self.system_prompt),
            UserMessage(content=prompt),
        ]
        try:
            response = await self.client.chat.complete_async(
                model=self.model_name,
                messages=messages,
            )
            if response is None:
                log.error("Received None response from Mistral API.")
            else:
                log.debug("Received raw response from Mistral API.")
            return response
        except Exception as e:
            log.error(f"Mistral API interaction failed: {e}")
            return None

    def _parse_response(self, response: Any) -> Optional[str]:
        try:
            choices = getattr(response, "choices", None)
            if choices:
                first = choices[0]
                if hasattr(first, "message") and hasattr(first.message, "content"):
                    return first.message.content
                if isinstance(first, dict):
                    return first.get("message", {}).get("content")

            # Fallback accessors
            for attr in ("output_text", "text"):
                value = getattr(response, attr, None)
                if value:
                    return value

            log.warning("Could not extract text from Mistral response; falling back to str().")
            return str(response)

        except Exception as e:
            log.error(f"Failed parsing Mistral response: {e}", exc_info=True)
            return str(response)
