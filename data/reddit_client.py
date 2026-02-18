import asyncpraw
import asyncprawcore
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
from typing import AsyncGenerator, Dict, Any, List

load_dotenv()
log = get_logger(__name__)


class RedditClient:
    SOURCE_NAME = "Reddit"

    def __init__(self):
        self.reddit = asyncpraw.Reddit(
            client_id=os.getenv("CLIENT_ID"),
            client_secret=os.getenv("CLIENT_SECRET"),
            user_agent=os.getenv("USER_AGENT"),
        )

    async def get_posts(
        self, subreddit_name: str, sort_by: str, limit: int, timeframe: str = TIMEFRAME
    ) -> List[Any]:
        log.debug(
            f"Retrieving posts from subreddit: {subreddit_name}, sort_by: {sort_by}, "
            f"limit: {limit}, timeframe: {timeframe}"
        )
        subreddit = await self.reddit.subreddit(subreddit_name)
        sort_by = sort_by.lower()

        posts = []
        try:
            if sort_by in ["top", "controversial"]:
                async for post in getattr(subreddit, sort_by)(limit=limit, time_filter=timeframe):
                    posts.append(post)
            else:
                method = getattr(subreddit, sort_by, None)
                if method:
                    async for post in method(limit=limit):
                        posts.append(post)
                else:
                    log.error(f"Invalid sort method: {sort_by}")

        except asyncprawcore.exceptions.AsyncPrawcoreException as e:
            log.error(f"Reddit API error fetching posts for {subreddit_name}: {e}")
        except Exception as e:
             log.error(f"Unexpected error fetching posts for {subreddit_name}: {e}")

        log.debug(f"Retrieved {len(posts)} posts")
        return posts

    async def get_comments(self, post_id: str) -> List[Any]:
        log.debug(f"Retrieving comments for post_id: {post_id}")

        try:
            submission = await self.reddit.submission(id=post_id)
            # Async PRAW comment extraction
            await submission.comments.replace_more(limit=0)
            all_comments = submission.comments.list()
        except asyncprawcore.exceptions.AsyncPrawcoreException as e:
            log.error(f"Error fetching comments for {post_id}: {e}")
            all_comments = []
        except Exception as e:
            log.error(f"Unexpected error fetching comments for {post_id}: {e}")
            all_comments = []

        log.debug(f"Retrieved {len(all_comments)} comments")
        return all_comments

    async def process_all_subreddits(
        self, sort_by: str, limit: int, timeframe: str = TIMEFRAME, subreddits: list = None
    ) -> AsyncGenerator[tuple[str, List[Dict[str, Any]]], None]:
        target_subreddits = subreddits if subreddits else SUBREDDIT_LIST
        log.info(f"Starting processing for subreddits: {target_subreddits}")

        for sub_name in target_subreddits:
            log.info(f"Processing subreddit: {sub_name}")
            allowed_flairs = SUBREDDIT_FLAIRS.get(sub_name, tuple())
            
            posts = await self.get_posts(sub_name, sort_by, limit, timeframe)
            if not posts:
                continue
                
            subreddit_data = []

            for post in posts:
                try:
                    if allowed_flairs:
                        # In Async PRAW, we might need to await load() if attributes are missing, but listings usually have them.
                        flair_text = getattr(post, "link_flair_text", None)
                        
                        if not flair_text:
                            continue

                        if flair_text not in allowed_flairs:
                            continue

                        if post.score < MIN_SCORE_POST:
                            continue
                            
                    comments = await self.get_comments(post.id)
                    post_data = {
                        "id": post.id,
                        "title": post.title,
                        "score": post.score,
                        "flair": getattr(post, "link_flair_text", None),
                        "selftext": post.selftext,
                        "comments": [
                            {"body": c.body, "score": c.score}
                            for c in comments
                            if hasattr(c, "body")
                            and c.score >= MIN_SCORE_COMMENT
                            and len(c.body) >= MIN_COMMENT_LENGTH
                        ],
                    }
                    subreddit_data.append(post_data)
                except Exception as e:
                    log.error(f"Error processing post {post.id}: {e}")
                    continue

            yield sub_name, subreddit_data
    
    async def close(self):
        await self.reddit.close()
