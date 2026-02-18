import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
import asyncio
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from main import process_input_file, _run_scraping_phase, _read_file_sync

class TestMainAsync(unittest.TestCase):
    
    @patch("main.asyncio.to_thread", new_callable=AsyncMock)
    @patch("main.parse_llm_json_to_df")
    async def test_process_input_file_async(self, mock_parse, mock_to_thread):
        print("Testing process_input_file async...")
        
        # Setup mocks
        mock_file_path = Path("test.json")
        mock_client = AsyncMock()
        mock_output_dir = Path("output")
        
        # Mock file read return
        mock_to_thread.side_effect = [
            '{"some": "json"}', # First call: _read_file_sync
            None # Second call: df.to_csv (we don't care about return)
        ]
        
        # Mock LLM response
        mock_client.get_response.return_value = [{"symbol": "TEST"}]
        
        # Mock DF parsing
        mock_df = MagicMock()
        mock_df.empty = False
        mock_parse.return_value = mock_df
        
        # Execute
        results = await process_input_file(mock_file_path, mock_client, mock_output_dir)
        
        # Verify
        assert len(results) == 1
        # Check that to_thread was called with _read_file_sync
        mock_to_thread.assert_any_call(_read_file_sync, mock_file_path)
        # Check that to_thread was called with df.to_csv
        # Note: checking arguments for bound methods is tricky, just checking to_thread called twice is good enough strong signal
        assert mock_to_thread.call_count == 2
        print("process_input_file async verification passed.")

    @patch("main.asyncio.to_thread", new_callable=AsyncMock)
    @patch("main.RedditClient")
    @patch("main.DataHandler")
    async def test_run_scraping_phase_async(self, MockDataHandler, MockRedditClient, mock_to_thread):
        print("Testing _run_scraping_phase async...")
        
        # Setup Mocks
        mock_reddit = MockRedditClient.return_value
        mock_data_handler = MockDataHandler.return_value
        
        # Async iterator mock for process_all_subreddits
        async def async_iter(*args, **kwargs):
            yield "test_sub", []
        
        mock_reddit.process_all_subreddits.side_effect = async_iter
        mock_reddit.close = AsyncMock()
        
        # Execute
        await _run_scraping_phase()
        
        # Verify
        # Check that data_handler.process_files_to_json was offloaded
        mock_to_thread.assert_called_with(mock_data_handler.process_files_to_json)
        print("_run_scraping_phase async verification passed.")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    test = TestMainAsync()
    loop.run_until_complete(test.test_process_input_file_async())
    loop.run_until_complete(test.test_run_scraping_phase_async())
