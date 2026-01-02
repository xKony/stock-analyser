from typing import List, Dict, Tuple

# ==============================================================================
# 1. FILE PATHS & DIRECTORIES
# ==============================================================================
DATA_OUTPUT_DIR = "stock_data/raw_json"  # Raw JSON data from Reddit
LLM_INPUT_DIR = "stock_data/llm_input"    # Cleaned text files ready for LLM
LLM_OUTPUT_DIR = "stock_data/llm_output"  # Final analysis CSVs
PROMPT_FILE = "LLM/prompts/system_prompt.txt" # Path to system prompt

# ==============================================================================
# 2. LLM CONFIGURATION (Mistral)
# ==============================================================================
DEFAULT_MODEL = "mistral-small-latest"

# Content Optimization
REMOVE_NON_ASCII = True  # If True, removes emojis/non-English chars to save tokens
MERGE_LLM_OUTPUT = True  # If True, combines all subreddits into one 'full_context.txt' file

# ==============================================================================
# 3. REDDIT SCRAPER CONFIGURATION
# ==============================================================================
# Scoping
TIMEFRAME = "week"       # Timeframe for "top" posts (hour, day, week, month, year, all)
COMMENT_LIMIT = 10       # Max number of top comments to retrieve per post

# Filtering Quality Control
MIN_SCORE_COMMENT = 10   # Minimum upvotes for a comment to be included
MIN_SCORE_POST = 10      # Minimum upvotes for a post to be included
MIN_COMMENT_LENGTH = 20  # Minimum character length for a comment

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
SAVE_LOGS = False        # Whether to write logs to disk
KEEP_RAW_JSON = False    # If False, deletes temporary .json files after processing

