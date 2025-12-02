from data.reddit_client import RedditClient
from utils.logger import get_logger

log = get_logger(__name__)


def main():
    client = RedditClient()
    posts = client.get_posts("python", sort_by="top", limit=5, timeframe="week")
    for post in posts:
        print(post.title, post.score)


if __name__ == "__main__":
    log.info("Starting application...")
    main()
