import praw
import os
from dotenv import load_dotenv
from utils.logger import get_logger
from config import (
    SUBREDDIT_LIST,
    SUBREDDIT_FLAIRS,
    TIMEFRAME,
    MIN_SCORE_COMMENT,
    MIN_COMMENT_LENGTH,
    MIN_SCORE_POST,
)

load_dotenv()
log = get_logger(__name__)


class RedditClient(object):
    def __init__(self):
        self.reddit: praw.Reddit = praw.Reddit(
            client_id=os.getenv("CLIENT_ID"),
            client_secret=os.getenv("CLIENT_SECRET"),
            user_agent=os.getenv("USER_AGENT"),
        )

    def get_posts(
        self, subreddit_name: str, sort_by: str, limit: int, timeframe: str = TIMEFRAME
    ) -> list:
        log.info(
            f"Retrieving posts from subreddit: {subreddit_name}, sort_by: {sort_by}, limit: {limit}, timeframe: {timeframe}"
        )
        subreddit = self.reddit.subreddit(subreddit_name)
        sort_by = sort_by.lower()

        if sort_by == "top" or sort_by == "controversial":
            iterator = getattr(subreddit, sort_by)(limit=limit, time_filter=timeframe)
        else:
            iterator = getattr(subreddit, sort_by)(limit=limit)
        posts: list = list(iterator)
        log.debug(f"Retrieved {len(posts)} posts")
        return posts

    def get_comments(self, post_id: str) -> list:
        log.info(f"Retrieving comments for post_id: {post_id}")

        submission = self.reddit.submission(id=post_id)

        submission.comments.replace_more(limit=0)

        all_comments: list = submission.comments.list()

        log.debug(f"Retrieved {len(all_comments)} comments")
        return all_comments

    def process_all_subreddits(
        self, sort_by: str, limit: int, timeframe: str = TIMEFRAME
    ):
        log.info(f"Starting processing for subreddits: {SUBREDDIT_LIST}")

        for sub_name in SUBREDDIT_LIST:
            log.info(f"Processing subreddit: {sub_name}")
            allowed_flairs = SUBREDDIT_FLAIRS.get(sub_name, tuple())
            posts = self.get_posts(sub_name, sort_by, limit, timeframe)
            subreddit_data = []

            for post in posts:
                if allowed_flairs:
                    if not post.link_flair_text:
                        log.debug(f"Skipping Post '{post.title}' (No Flair)")
                        continue

                    if post.link_flair_text not in allowed_flairs:
                        log.debug(
                            f"Skipping Post '{post.title}' (Flair: {post.link_flair_text} not in allowed list)"
                        )
                        continue

                    if post.score < MIN_SCORE_POST:
                        log.debug(
                            f"Skipping Post '{post.title}' (Score: {post.score} too low)"
                        )
                        continue
                comments = self.get_comments(post.id)
                post_data = {
                    "id": post.id,
                    "title": post.title,
                    "score": post.score,
                    "flair": post.link_flair_text,
                    "selftext": post.selftext,
                    "comments": [
                        {"body": c.body, "score": c.score}
                        for c in comments
                        if hasattr(c, "body")
                        if c.score >= MIN_SCORE_COMMENT
                        if len(c.body) >= MIN_COMMENT_LENGTH
                    ],
                }
                subreddit_data.append(post_data)
                log.debug(f"Found {len(comments)} comments for post: {post.id}")

            yield sub_name, subreddit_data
