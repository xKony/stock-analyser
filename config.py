# LLM configuration
PROMPT_FILE = "LLM/prompts/system_prompt.txt"
DEFAULT_MODEL = "mistral-small-latest"
REMOVE_NON_ASCII = (
    True  # If True, removes all Emojis and non-English characters (Saves tokens)
)

# Reddit configuration
COMMENT_LIMIT = 10

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
        "Industry news",
    ),
    "wallstreetbets": ("DD", "Daily Discussion", "Charts", "Gain", "Loss", "News"),
    "StockMarket": ("News", "Discussion", "Technical Analysis"),
    "investing": (),
    "trading": ("Technical analysis", "Discussion"),
    "dividends": ("Discussion"),
    "ValueInvesting": ("Stock Analysis", "Discussion"),
}


MIN_SCORE_COMMENT = 10  # prevent saving comments with low score
MIN_SCORE_POST = 10  # prevent saving posts with low score
MIN_COMMENT_LENGTH = 20  # prevent saving short comments
TIMEFRAME = "week"


# Files management
DATA_OUTPUT_DIR = "stock_data/raw_json"
LLM_INPUT_DIR = "stock_data/llm_input"
LLM_OUTPUT_DIR = "stock_data/llm_output"
SAVE_LOGS = False
LOG_LEVEL = "DEBUG"
KEEP_RAW_JSON = False  # If False, deletes the .json file immediately after processing to save disk space
MERGE_LLM_OUTPUT = True  # If True, combines ALL subreddits into one single 'full_context.txt', if False, creates 'stocks.txt', 'wallstreetbets.txt', etc.
