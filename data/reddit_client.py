import praw
import os
from dotenv import load_dotenv
from utils.logger import get_logger

load_dotenv()
log = get_logger(__name__)


class RedditClient(object):
    def __init__(self):
        self.reddit: praw.Reddit = praw.Reddit(
            client_id=os.getenv("CLIENT_ID"),
            client_secret=os.getenv("CLIENT_SECRET"),
            user_agent=os.getenv("USER_AGENT"),
        )

    def get_posts(self, subreddit_name: str, sort_by: str, limit: int, timeframe: str):
        log.info(
            f"Retrieving posts from subreddit: {subreddit_name}, sort_by: {sort_by}, limit: {limit}, timeframe: {timeframe}"
        )
        subreddit = self.reddit.subreddit(subreddit_name)
        sort_by = sort_by.lower()

        if sort_by == "top" or sort_by == "controversial":
            iterator = getattr(subreddit, sort_by)(limit=limit, time_filter=timeframe)
        else:
            iterator = getattr(subreddit, sort_by)(limit=limit)

        # 3. Return the list of posts
        return list(iterator)

    def get_comments(self, post_id: str):
        pass
