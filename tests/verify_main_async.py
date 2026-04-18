import asyncio
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Add project root to path
sys.path.append(os.getcwd())

from main import _process_single_file, _run_scraping_phase


class TestMainAsync(unittest.IsolatedAsyncioTestCase):

    @patch("main.asyncio.to_thread", new_callable=AsyncMock)
    async def test_process_single_file_async(self, mock_to_thread: AsyncMock) -> None:
        """_process_single_file should return LLM records on a valid response."""
        print("Testing _process_single_file async...")

        mock_file_path = MagicMock(spec=Path)
        mock_file_path.name = "test.json"

        from data.models import SentimentRecord
        mock_client = AsyncMock()
        expected_records = [
            SentimentRecord(
                symbol="TEST",
                sentiment_score=0.5,
                sentiment_confidence=0.8,
                sentiment_label="BUY",
                key_rationale="test"
            )
        ]

        # First to_thread call returns the file content.
        mock_to_thread.return_value = '{"some": "json"}'
        mock_client.get_response.return_value = expected_records

        results = await _process_single_file(mock_file_path, mock_client)

        assert results == expected_records
        mock_client.get_response.assert_awaited_once()
        print("_process_single_file async verification passed.")

    @patch("main.asyncio.to_thread", new_callable=AsyncMock)
    @patch("main.RedditClient")
    @patch("main.DataHandler")
    async def test_run_scraping_phase_async(
        self,
        MockDataHandler: MagicMock,
        MockRedditClient: MagicMock,
        mock_to_thread: AsyncMock,
    ) -> None:
        """_run_scraping_phase should offload file processing to a thread."""
        print("Testing _run_scraping_phase async...")

        mock_reddit = MockRedditClient.return_value
        mock_data_handler = MockDataHandler.return_value

        async def async_iter(*args, **kwargs):
            yield "test_sub", []

        mock_reddit.process_all_subreddits.side_effect = async_iter
        mock_reddit.close = AsyncMock()

        await _run_scraping_phase()

        mock_to_thread.assert_called_with(mock_data_handler.process_files_to_json)
        print("_run_scraping_phase async verification passed.")


if __name__ == "__main__":
    asyncio.run(unittest.main())
