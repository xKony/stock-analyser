from typing import List, Dict, Tuple

# ==============================================================================
# 1. FILE PATHS & DIRECTORIES
# ==============================================================================
DATA_OUTPUT_DIR = "stock_data/raw_json"  # Raw JSON data from Reddit
LLM_INPUT_DIR = "stock_data/llm_input"    # Cleaned text files ready for LLM
LLM_OUTPUT_DIR = "stock_data/llm_output"  # Final analysis CSVs
SENTIMENT_ANALYSIS_OUTPUT_PATH = "stock_data/sentiment_analysis.csv" # Path for the aggregated final CSV
PROMPT_FILE = "LLM/prompts/system_prompt.txt" # Path to system prompt

# ==============================================================================
# 2. LLM CONFIGURATION (Mistral)
# ==============================================================================
# Active Model Selection
# Options: "mistral", "gemini"
ACTIVE_MODEL = "gemini"

LLM_PROVIDERS = {
    "mistral": {
        "model_name": "mistral-small-latest",
        "env_key": "MISTRAL_API_KEY",
        "rpm": 20,  # Requests per minute
        "rpd": 1000 # Requests per day
    },
    "gemini": {
        "model_name": "gemini-2.5-pro",
        "env_key": "GEMINI_API_KEY",
        "rpm": 10,   # Free tier approx limit, adjust as needed
        "rpd": 1000  # Free tier daily limit
    }
}

# Legacy constants for backward compatibility if needed, but we should migrate away
DEFAULT_MODEL = LLM_PROVIDERS["mistral"]["model_name"]
DEFAULT_GEMINI_MODEL = LLM_PROVIDERS["gemini"]["model_name"]

RATE_LIMIT_STATE_FILE = "logs/rate_limit_state.json"

# Content Optimization
REMOVE_NON_ASCII = True  # If True, removes emojis/non-English chars to save tokens
MERGE_LLM_OUTPUT = False  # If True, combines all subreddits into one 'full_context.txt' file

# ==============================================================================
# 3. REDDIT SCRAPER CONFIGURATION
# ==============================================================================
# Scoping
TIMEFRAME = "week"       # Timeframe for "top" posts (hour, day, week, month, year, all)
COMMENT_LIMIT = 10       # Max number of top comments to retrieve per post

# Filtering Quality Control
MIN_SCORE_COMMENT = 10   # Minimum upvotes for a comment to be included
MIN_SCORE_POST = 10      # Minimum upvotes for a post to be included
MIN_COMMENT_LENGTH = 30  # Minimum character length for a comment

# Target Subreddits
SUBREDDIT_LIST: List[str] = [
    "stocks",
    "wallstreetbets",
    "StockMarket",
    "investing",
    "trading",
    "dividends",
    "ValueInvesting",
]

# Flair Filters (Empty tuple = no filter / fetch all)
SUBREDDIT_FLAIRS: Dict[str, Tuple[str, ...]] = {
    "stocks": (
        "Company Discussion",
        "Broad market news",
        "Company news",
        "Industry Discussion",
        "Trades",
        "Industry news",
    ),
    "wallstreetbets": ("DD", "Daily Discussion", "Charts", "Gain", "Loss", "News"),
    "StockMarket": ("News", "Discussion", "Technical Analysis"),
    "investing": (),  # No specific flair filtering
    "trading": ("Technical analysis", "Discussion"),
    "dividends": ("Discussion",),
    "ValueInvesting": ("Stock Analysis", "Discussion"),
}

# ==============================================================================
# 4. APPLICATION SETTINGS
# ==============================================================================
LOG_LEVEL = "DEBUG"
SAVE_LOGS = True        # Whether to write logs to disk
KEEP_RAW_JSON = False    # If False, deletes temporary .json files after processing
KEEP_LLM_INPUT = False   # If False, deletes intermediate .txt files used for LLM input
KEEP_LLM_OUTPUT = False  # If False, deletes intermediate .csv files from LLM output
