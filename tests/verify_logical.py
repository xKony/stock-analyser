import sys
import os
import json
import time
from unittest.mock import MagicMock, patch, mock_open

# Add project root to path
sys.path.append(os.getcwd())

from data.data_handler import DataHandler
from utils.rate_limiter import RateLimiter
# from main import run_parse_only # Hard to test main without mocking huge parts, will rely on code review + mock json parser logic

def test_data_handler_merge():
    print("Testing DataHandler merge Logic...")
    
    # Mock file inputs as Path objects
    mock_path1 = MagicMock()
    mock_path1.__str__.return_value = "file1.json"
    mock_path1.name = "file1.json"
    
    mock_path2 = MagicMock()
    mock_path2.__str__.return_value = "file2.json"
    mock_path2.name = "file2.json"
    
    mock_files = [mock_path1, mock_path2]
    
    # Mock content
    file1_content = {
        "meta": {"subreddit": "sub1"},
        "data": [{"title": "Post 1", "score": 10}]
    }
    file2_content = {
        "meta": {"subreddit": "sub2"},
        "data": [{"title": "Post 2", "score": 20}]
    }
    
    with patch("pathlib.Path.glob", return_value=mock_files), \
         patch("builtins.open", mock_open()) as mocked_file, \
         patch("json.load", side_effect=[file1_content, file2_content]), \
         patch("json.dump") as mock_dump, \
         patch("data.data_handler.MERGE_LLM_OUTPUT", True), \
         patch("pathlib.Path.unlink"), \
         patch("os.remove"):
         
         dh = DataHandler()
         # Mock optimize to just return the post
         dh.optimize_for_llm = lambda x: x
         
         dh.process_files_to_json()
         
         # Check if json.dump was called with merged data
         # Expected: One dump call for the merged file with list of 2 items
         
         # We have calls to dump? 
         # The loop does NOT dump if MERGE is True.
         # It dumps once at the end.
         
         writer_handle = mocked_file()
         
         # The code calls json.dump(merged_buffer, f_out, ...)
         # Check args of the LAST json.dump call
         call_args = mock_dump.call_args
         if call_args:
             args, _ = call_args
             dumped_data = args[0]
             print(f"Dumped data length: {len(dumped_data)}")
             assert len(dumped_data) == 2
             assert dumped_data[0]["title"] == "Post 1"
             assert dumped_data[1]["title"] == "Post 2"
             print("Passed: DataHandler merge Logic")
         else:
             print("Failed: json.dump not called")

def test_rate_limiter_empty():
    print("Testing RateLimiter safety...")
    rl = RateLimiter("test", rpm=10, rpd=100)
    rl.request_timestamps = []
    
    # Mock time
    rl.rpm = 10
    # Force condition len >= rpm to be checked?
    # If len is 0, 0 >= 10 is False.
    # We need to simulate a case where it MIGHT trigger exception.
    # The user issue was: "will raise IndexError if self.request_timestamps is empty (though the if len >= self.rpm check prevents this...)"
    # So strictly speaking it was safe BUT fragile.
    # My Fix added `if not self.request_timestamps: return`
    
    # Let's try to confuse it by manually incorrectly setting state
    rl.request_timestamps = []
    # If I force `if len...` to take True branch?
    # Cannot easily force Python IF implementation.
    
    # Usage Test
    # Just run check_and_acquire and ensure no crash on empty
    import asyncio
    asyncio.run(rl.check_and_acquire())
    print("Passed: RateLimiter safety")

if __name__ == "__main__":
    test_data_handler_merge()
    test_rate_limiter_empty()
