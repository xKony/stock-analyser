# LLM configuration
PROMPT_FILE = "LLM/prompts/default_prompt.txt"
DEFAULT_MODEL = "mistral-small-latest"

# Reddit configuration
COMMENT_LIMIT = 0
# limit=0: Removes "Load more comments" buttons (safest/fastest).
# limit=None: Fetches EVERY comment (can take a long time and hit API limits).
"""
SUBREDDIT_LIST = [
    "stocks",
]
"""
SUBREDDIT_LIST = [
    "stocks",
    "wallstreetbets",
    "StockMarket",
    "investing",
    "trading",
    "dividends",
    "ValueInvesting",
]

SUBREDDIT_FLAIRS = {
    "stocks": (
        "Company Discussion",
        "Broad market news",
        "Company news",
        "Industry Discussion",
        "Trades",
    ),
    "wallstreetbets": ("DD", "Daily Discussion", "Charts", "Gain", "Loss", "News"),
    "StockMarket": ("News", "Discussion", "Technical Analysis"),
    "investing": (),
    "trading": ("Discussion", "Technical Analysis"),
    "dividends": ("Discussion"),
    "ValueInvesting": ("Stock Analysis", "Discussion"),
}


MIN_SCORE_COMMENT = 10  # prevent saving comments with low score
MIN_COMMENT_LENGTH = 20  # prevent saving short comments
TIMEFRAME = "day"


# Logs
DATA_OUTPUT_DIR = "stock_data/raw_json"
LLM_INPUT_DIR = "stock_data/llm_input"
SAVE_LOGS = False
LOG_LEVEL = "DEBUG"
