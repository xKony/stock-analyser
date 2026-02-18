import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json
from pathlib import Path

# Add project root
sys.path.append(os.getcwd())

from data.data_handler import DataHandler

class TestIncrementalProcessing(unittest.TestCase):
    def setUp(self):
        # Setup temporary directories
        self.output_dir = Path("tests/temp_raw_json")
        self.input_dir = Path("tests/temp_llm_input")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.input_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        # Cleanup
        import shutil
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir)
        if self.input_dir.exists():
            shutil.rmtree(self.input_dir)

    def test_incremental_skip(self):
        print("Testing incremental skipping...")
        
        # 1. Create dummy raw file
        filename = "test_sub_20240101.json"
        raw_file = self.output_dir / filename
        with open(raw_file, "w") as f:
            json.dump({
                "meta": {"subreddit": "test_sub"},
                "data": [{"title": "Test Post", "selftext": "Content"}]
            }, f)
            
        # 2. Mock config to ensure directories point to our temp ones
        # We need to patch DataHandler.output_dir and llm_input_dir AFTER initialization or patch the class init
        # Easier to specific paths in init if the class allowed, but it hardcodes config.
        # So we patch the class instance attributes after creation or patch config.
        
        with patch("data.data_handler.DATA_OUTPUT_DIR", str(self.output_dir)), \
             patch("data.data_handler.LLM_INPUT_DIR", str(self.input_dir)), \
             patch("data.data_handler.MERGE_LLM_OUTPUT", False), \
             patch("data.data_handler.KEEP_RAW_JSON", True): # Keep raw to simulate re-run
            
            dh = DataHandler()
            # Force update instance paths because init might have run before patches if imported?? 
            # No, patches are active during init.
            # But wait, DataHandler init uses Path(DATA_OUTPUT_DIR).
            
            # RUN 1: Should process
            dh.process_files_to_json()
            
            # Verify output file exists
            target_file = self.input_dir / filename
            assert target_file.exists()
            
            # Check modification time
            mtime_initial = target_file.stat().st_mtime
            
            # RUN 2: Should SKIP
            # To verify skip, we can check logs or just check that mtime hasn't changed (if fast enough)
            # or mock optimize_for_llm and see if it's called.
            
            with patch.object(dh, 'optimize_for_llm', side_effect=Exception("Should not be called!")) as mock_optimize:
                 dh.process_files_to_json()
                 # If it calls optimize, it will raise exception and fail test
            
            print("Incremental skip passed.")

if __name__ == "__main__":
    unittest.main()
