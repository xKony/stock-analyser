import time
import json
import os
import asyncio
from datetime import datetime
from typing import Dict, Any
from config import RATE_LIMIT_STATE_FILE
from utils.logger import get_logger

log = get_logger(__name__)

class RateLimiter:
    def __init__(self, provider_name: str, rpm: int, rpd: int, state_file: str = RATE_LIMIT_STATE_FILE):
        self.provider_name = provider_name
        self.rpm = rpm
        self.rpd = rpd
        self.state_file = state_file
        
        # RPM Tracking (In-memory)
        self.request_timestamps = []
        
        # RPD Tracking (Persistent)
        self.daily_usage = 0
        self.last_reset_date = datetime.now().strftime("%Y-%m-%d")
        
        self._load_state()

    def _load_state(self):
        """Loads the daily usage state from the JSON file."""
        if not os.path.exists(self.state_file):
            return

        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                
            provider_data = data.get(self.provider_name, {})
            self.daily_usage = provider_data.get("daily_usage", 0)
            self.last_reset_date = provider_data.get("last_reset_date", datetime.now().strftime("%Y-%m-%d"))
            
            # Check if we need to reset for a new day immediately upon load
            self._reset_daily_if_needed()
            
        except Exception as e:
            log.error(f"Failed to load rate limit state: {e}")

    def _save_state(self):
        """Saves the daily usage state to the JSON file."""
        data = {}
        # Load existing data first to preserve other providers
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
            except Exception:
                pass # Start fresh if corrupt

        data[self.provider_name] = {
            "daily_usage": self.daily_usage,
            "last_reset_date": self.last_reset_date
        }

        try:
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            with open(self.state_file, 'w') as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            log.error(f"Failed to save rate limit state: {e}")

    def _reset_daily_if_needed(self):
        """Resets the daily counter if the date has changed."""
        current_date = datetime.now().strftime("%Y-%m-%d")
        if current_date != self.last_reset_date:
            log.info(f"New day detected ({current_date}). Resetting RPD for {self.provider_name}.")
            self.daily_usage = 0
            self.last_reset_date = current_date
            self._save_state()

    async def check_and_acquire(self):
        """
        Checks rate limits. 
        - If RPM limit is reached, waits until a slot is available.
        - If RPD limit is reached, raises an exception (or returns False).
        """
        self._reset_daily_if_needed()

        # 1. Check Requests Per Day (RPD)
        if self.daily_usage >= self.rpd:
            error_msg = f"Daily rate limit ({self.rpd}) exceeded for {self.provider_name}."
            log.critical(error_msg)
            raise ValueError(error_msg)

        # 2. Check Requests Per Minute (RPM)
        current_time = time.time()
        # Remove timestamps older than 60 seconds
        self.request_timestamps = [t for t in self.request_timestamps if current_time - t < 60]

        if len(self.request_timestamps) >= self.rpm:
            # Calculate wait time
            oldest_timestamp = self.request_timestamps[0]
            wait_time = 60 - (current_time - oldest_timestamp) + 1 # +1 buffer
            
            if wait_time > 0:
                log.warning(f"RPM limit ({self.rpm}) reached for {self.provider_name}. Waiting {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)
                # Recursive call to re-check after waiting (safety)
                # But since we are single-threaded async here roughly, simply adding to list 
                # after wait might be safe enough, but logic is cleaner if we just proceed
                # Update current time after sleep
                current_time = time.time()
                # Clean up again
                self.request_timestamps = [t for t in self.request_timestamps if current_time - t < 60]

        # 3. Acquire Slot
        self.request_timestamps.append(time.time())
        self.daily_usage += 1
        self._save_state()
        log.debug(f"{self.provider_name} request acquired. Daily: {self.daily_usage}/{self.rpd}, RPM: {len(self.request_timestamps)}/{self.rpm}")
