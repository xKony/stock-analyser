from data.reddit_client import RedditClient
from data.data_handler import DataHandler
from utils.logger import get_logger

log = get_logger(__name__)


def main():
    get_subreddit_data()


def get_subreddit_data():
    reddit_client = RedditClient()
    data_handler = DataHandler()
    for sub_name, data in reddit_client.process_all_subreddits(sort_by="top", limit=20):
        data_handler.save_subreddit_data(sub_name, data)
    data_handler.process_files_to_txt()


if __name__ == "__main__":
    log.info("Starting application...")
    main()
