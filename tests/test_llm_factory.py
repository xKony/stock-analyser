import asyncio
import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from LLM.factory import get_llm_client
from config import ACTIVE_MODEL
from utils.logger import get_logger

log = get_logger(__name__)

async def test_llm_connection():
    log.info(f"Testing LLM Client Connection (Active Model: {ACTIVE_MODEL})...")
    try:
        client = get_llm_client()
        log.info(f"Client initialized: {type(client).__name__}")
        
        response = await client.get_response("Hello, this is a test. Are you working?")
        if response is not None:
            # Mistral returns List[dict], Gemini returns List[dict] now too
            log.info(f"Received Response: {response}")
        else:
            log.error("No response received.")
    except Exception as e:
        log.error(f"Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm_connection())
