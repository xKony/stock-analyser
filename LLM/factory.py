from typing import Any
from config import ACTIVE_MODEL, LLM_PROVIDERS
from LLM.mistral_client import MistralClient
from LLM.gemini_client import GeminiClient
from utils.logger import get_logger

log = get_logger(__name__)

def get_llm_client() -> Any:
    """
    Factory function to return the configured LLM client instance.
    """
    active_model = ACTIVE_MODEL.lower()
    
    if active_model == "mistral":
        config = LLM_PROVIDERS['mistral']
        log.info(f"Initializing MistralClient using model: {config['model_name']}")
        return MistralClient(
            model=config['model_name'],
            rpm=config.get('rpm', 60),
            rpd=config.get('rpd', 1000)
        )
        
    elif active_model == "gemini":
        config = LLM_PROVIDERS['gemini']
        log.info(f"Initializing GeminiClient using model: {config['model_name']}")
        return GeminiClient(
            model=config['model_name'],
            rpm=config.get('rpm', 15),
            rpd=config.get('rpd', 1500)
        )
        
    else:
        error_msg = f"Invalid ACTIVE_MODEL configured: {active_model}. Available options: {list(LLM_PROVIDERS.keys())}"
        log.critical(error_msg)
        raise ValueError(error_msg)
