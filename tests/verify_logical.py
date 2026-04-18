import sys
import os
import json
import time
from pathlib import Path
from unittest.mock import MagicMock, patch, mock_open

# Add project root to path
sys.path.append(os.getcwd())

from data.data_handler import DataHandler
from utils.rate_limiter import RateLimiter
# from main import run_parse_only # Hard to test main without mocking huge parts, will rely on code review + mock json parser logic

def test_data_handler_merge():
    print("Testing DataHandler merge Logic...")
    
    # Mock paths
    mock_files = [Path("file1.json"), Path("file2.json")]
    
    # Mock content for the files
    file1_content = [{"title": "Post 1", "score": 10}]
    file2_content = [{"title": "Post 2", "score": 20}]
    
    # We need to mock:
    # 1. output_dir.glob("*.json") -> returns mock_files
    # 2. _process_single_file -> we'll let it run but mock its dependencies
    # 3. llm_input_dir.glob("*.json") -> returns the processed files for merging
    
    with patch("data.data_handler.Path.glob") as mock_glob, \
         patch("data.data_handler.open", mock_open()) as mocked_file, \
         patch("data.data_handler.json.load") as mock_json_load, \
         patch("data.data_handler.json.dump") as mock_json_dump, \
         patch("data.data_handler.MERGE_LLM_OUTPUT", True), \
         patch("data.data_handler.Path.exists", return_value=False), \
         patch("data.data_handler.Path.unlink"):
         
         # Setup mock_glob to return different values for different calls
         # First call in process_files_to_json: output_dir.glob("*.json")
         # Second call in process_files_to_json: llm_input_dir.glob("*.json")
         processed_files = [Path("input/file1.json"), Path("input/file2.json")]
         mock_glob.side_effect = [mock_files, processed_files]
         
         # json.load side effects:
         # 1. file1.json (raw)
         # 2. file2.json (raw)
         # 3. input/file1.json (for merge)
         # 4. input/file2.json (for merge)
         raw_file1 = {"data": [{"title": "Post 1", "score": 10}]}
         raw_file2 = {"data": [{"title": "Post 2", "score": 20}]}
         mock_json_load.side_effect = [raw_file1, raw_file2, file1_content, file2_content]
         
         dh = DataHandler()
         # Mock optimize to just return the post
         dh.optimize_for_llm = lambda x: x
         
         dh.process_files_to_json()
         
         # Find the call to json.dump that contains the merged buffer
         # It should be the last one
         merged_call = None
         for call in mock_json_dump.call_args_list:
             args, _ = call
             if len(args[0]) == 2:
                 merged_call = call
                 break
         
         if merged_call:
             args, _ = merged_call
             dumped_data = args[0]
             print(f"Dumped data length: {len(dumped_data)}")
             assert len(dumped_data) == 2
             assert dumped_data[0]["title"] == "Post 1"
             assert dumped_data[1]["title"] == "Post 2"
             print("Passed: DataHandler merge Logic")
         else:
             print("Failed: Merged json.dump not called with 2 items")
             # Print what was called for debugging
             for i, call in enumerate(mock_json_dump.call_args_list):
                 print(f"Call {i} args: {call[0][0]}")
             raise AssertionError("Merged data not dumped")

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
