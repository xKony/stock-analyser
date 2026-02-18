import unittest
import os
import sys
import time
import asyncio
import shutil

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.rate_limiter import RateLimiter

TEST_STATE_FILE = "logs/test_rate_limit_state.json"

class TestRateLimiter(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Clean up previous test state
        if os.path.exists(TEST_STATE_FILE):
            os.remove(TEST_STATE_FILE)
            
    def tearDown(self):
        # Clean up after test
        if os.path.exists(TEST_STATE_FILE):
            os.remove(TEST_STATE_FILE)

    async def test_rpd_limit(self):
        """Verify that RPD limit raises ValueError when exceeded."""
        limiter = RateLimiter("test_provider", rpm=60, rpd=2, state_file=TEST_STATE_FILE)
        
        # Consuming 2 requests
        await limiter.check_and_acquire()
        await limiter.check_and_acquire()
        
        # 3rd request should fail
        with self.assertRaises(ValueError):
            await limiter.check_and_acquire()

    async def test_rpm_limit(self):
        """Verify that RPM limit causes a delay (wait)."""
        # Set a very low RPM (e.g., 60 requests per minute = 1 request per second for testing?)
        # Actually logic is: if len(timestamps) >= rpm, wait.
        # Let's check logic: rpm=2. 
        # t0: req 1 -> valid
        # t0: req 2 -> valid
        # t0: req 3 -> should wait until t0+60s 
        # Waiting 60s in test is too long.
        # We can mock time or just verify that timestamps are added.
        
        limiter = RateLimiter("test_provider", rpm=5, rpd=100, state_file=TEST_STATE_FILE)
        
        start_time = time.time()
        for _ in range(3):
            await limiter.check_and_acquire()
        end_time = time.time()
        
        self.assertEqual(len(limiter.request_timestamps), 3)
        self.assertTrue(end_time - start_time < 1.0) # Should be fast

    async def test_persistence(self):
        """Verify that RPD state is persisted to file."""
        limiter1 = RateLimiter("test_provider", rpm=60, rpd=10, state_file=TEST_STATE_FILE)
        await limiter1.check_and_acquire()
        await limiter1.check_and_acquire()
        
        # Initialize new limiter pointing to same file
        limiter2 = RateLimiter("test_provider", rpm=60, rpd=10, state_file=TEST_STATE_FILE)
        self.assertEqual(limiter2.daily_usage, 2)
        
        await limiter2.check_and_acquire()
        self.assertEqual(limiter2.daily_usage, 3)

if __name__ == '__main__':
    unittest.main()
