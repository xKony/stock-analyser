from data.reddit_client import RedditClient
from data.data_handler import DataHandler
from utils.logger import get_logger

log = get_logger(__name__)


def main():
    get_subreddit_data()


def get_subreddit_data():
    reddit_client = RedditClient()
    data_handler = DataHandler()
    for sub_name, data in reddit_client.process_all_subreddits(sort_by="top", limit=5):
        data_handler.save_subreddit_data(sub_name, data)
    for subreddit, llm_ready_text in data_handler.load_and_process_files():
        print(f"--- Ready to send to LLM (Source: {subreddit}) ---")
        print(llm_ready_text)
        print("-" * 30)


if __name__ == "__main__":
    log.info("Starting application...")
    main()
