import os
import json
from dotenv import load_dotenv
from mistralai import Mistral
from mistralai.models import UserMessage, SystemMessage
from config import PROMPT_FILE, DEFAULT_MODEL
from utils.logger import get_logger
from typing import Optional

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

    except Exception as e:
        log.error(f"Error loading prompt file: {e}")
        raise e


class Mistral_Client:
    def __init__(self, model: str = DEFAULT_MODEL):
        # Mask API key in logs for security
        api_key: Optional[str] = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            log.error("Environment variable MISTRAL_API_KEY not set.")
            return
        masked_key = (
            f"****{api_key[-4:]}"
            if api_key and len(api_key) > 8
            else "INVALID"
        )
        log.debug(f"Initializing Mistral Client. Model: {model}, Key: {masked_key}")

        self.client = Mistral(api_key=api_key)
        self.model = model
        try:
            self.system_prompt = _load_prompt()
        except Exception as e:
            log.critical(
                "Failed to initialize Mistral Client due to prompt loading error."
            )
            raise e

        log.info("Mistral Client initialized successfully.")

    async def get_response_raw(self, messages: list):
        log.info(f"Sending request to Mistral model ({self.model})...")
        try:
            response = await self.client.chat.complete_async(
                model=self.model, messages=messages
            )
            if response is None:
                log.error("Received None response from Mistral API.")
            else:
                log.debug("Received raw response from Mistral API.")
            return response
        except Exception as e:
            log.error(f"Exception during Mistral API call: {e}")
            return None

    def parse_response(self, response):
        if response is None:
            log.warning("Cannot parse None response.")
            return None

        log.debug(f"Parsing response of type: {type(response)}")
        try:
            content = None

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

            # 3. Last resort: String conversion
            if content is None:
                content = str(response)

            return content

        except Exception as e:
            log.error(f"Failed parsing Mistral response: {e}", exc_info=True)
            return str(response)

    async def get_response(self, input_text: str):
        log.info("Starting response generation sequence...")

        # Construct messages with System Instruction
        messages = [
            SystemMessage(content=self.system_prompt),
            UserMessage(content=input_text),
        ]

        # Call API
        raw = await self.get_response_raw(messages)

        if raw:
            # Extract raw content string
            content_str = self.parse_response(raw)
            if not content_str:
                return None

            log.info("Generated Reply successfully.")
            return content_str
        else:
            log.error("Response generation failed (No raw response).")
            return None
