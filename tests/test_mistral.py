import asyncio
import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from LLM.mistral_client import Mistral_Client
from utils.logger import get_logger

log = get_logger(__name__)

async def test_mistral_connection():
    log.info("Testing Mistral Client Connection...")
    try:
        client = Mistral_Client()
        response = await client.get_response("Hello, this is a test. Are you working?")
        if response:
            log.info(f"Received Response: {response}")
        else:
            log.error("No response received.")
    except Exception as e:
        log.error(f"Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_mistral_connection())
