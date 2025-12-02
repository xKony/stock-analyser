# LLM configuration
PROMPT_FILE = "LLM/prompts/default_prompt.txt"
DEFAULT_MODEL = "mistral-small-latest"

# Reddit configuration
COMMENT_LIMIT = 0
# limit=0: Removes "Load more comments" buttons (safest/fastest).
# limit=None: Fetches EVERY comment (can take a long time and hit API limits).
SUBREDDIT_LIST = [
    "stocks",
]
"""
SUBREDDIT_LIST = [
    "stocks",
    "wallstreetbets",
    "StockMarket",
    "investing",
    "Options",
    "trading",
    "dividends",
    "ValueInvesting",
]
"""

MIN_SCORE_COMMENT = 4  # prevent saving comments with low score
TIMEFRAME = "day"


# Logs
DATA_OUTPUT_DIR = "stock_data/raw_json"
SAVE_LOGS = False
LOG_LEVEL = "DEBUG"
