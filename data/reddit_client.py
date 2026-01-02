import asyncpraw
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
    SOURCE_NAME = "Reddit"

    def __init__(self):
        self.reddit = asyncpraw.Reddit(
            client_id=os.getenv("CLIENT_ID"),
            client_secret=os.getenv("CLIENT_SECRET"),
            user_agent=os.getenv("USER_AGENT"),
        )

    async def get_posts(
        self, subreddit_name: str, sort_by: str, limit: int, timeframe: str = TIMEFRAME
    ) -> list:
        log.info(
            f"Retrieving posts from subreddit: {subreddit_name}, sort_by: {sort_by}, limit: {limit}, timeframe: {timeframe}"
        )
        subreddit = await self.reddit.subreddit(subreddit_name)
        sort_by = sort_by.lower()

        posts = []
        if sort_by == "top" or sort_by == "controversial":
            async for post in getattr(subreddit, sort_by)(limit=limit, time_filter=timeframe):
                posts.append(post)
        else:
            async for post in getattr(subreddit, sort_by)(limit=limit):
                posts.append(post)
        
        log.debug(f"Retrieved {len(posts)} posts")
        return posts

    async def get_comments(self, post_id: str) -> list:
        log.info(f"Retrieving comments for post_id: {post_id}")

        submission = await self.reddit.submission(id=post_id)
        # Load the submission to ensure comments can be accessed/replaced
        # await submission.load() # This is implied by replacing more sometimes, but accessing comments might need it
        
        # Async PRAW comment extraction
        try:
            await submission.comments.replace_more(limit=0)
            all_comments = submission.comments.list()
        except Exception as e:
            log.error(f"Error fetching comments for {post_id}: {e}")
            all_comments = []

        log.debug(f"Retrieved {len(all_comments)} comments")
        return all_comments

    async def process_all_subreddits(
        self, sort_by: str, limit: int, timeframe: str = TIMEFRAME, subreddits: list = None
    ):
        target_subreddits = subreddits if subreddits else SUBREDDIT_LIST
        log.info(f"Starting processing for subreddits: {target_subreddits}")

        for sub_name in target_subreddits:
            log.info(f"Processing subreddit: {sub_name}")
            allowed_flairs = SUBREDDIT_FLAIRS.get(sub_name, tuple())
            
            try:
                posts = await self.get_posts(sub_name, sort_by, limit, timeframe)
            except Exception as e:
                log.error(f"Failed to fetch posts for {sub_name}: {e}")
                continue
                
            subreddit_data = []

            for post in posts:
                # In Async PRAW, attributes like link_flair_text are lazy? 
                # Usually if coming from a listing they are populated.
                # Just in case, try/except AttributeError if needed, but PRAW populates listings.
                
                try:
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
                            
                    comments = await self.get_comments(post.id)
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
                except Exception as e:
                    log.error(f"Error processing post {post.id}: {e}")
                    continue

            yield sub_name, subreddit_data
    
    async def close(self):
        await self.reddit.close()
