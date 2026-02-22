import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

# Add project root to path
sys.path.append(os.getcwd())

from LLM.base_llm import validate_stock_sentiment_json
from data.data_handler import DataHandler
from main import _cleanup_directories


class TestEdgeCases(unittest.TestCase):

    def test_cleanup_directories_non_existent(self) -> None:
        """_cleanup_directories should not raise for non-existent paths."""
        print("Testing _cleanup_directories with non-existent paths...")
        non_existent = Path("non_existent_dir_12345")
        try:
            _cleanup_directories(non_existent, non_existent)
            print("Passed: _cleanup_directories with non-existent path")
        except Exception as e:
            self.fail(f"_cleanup_directories raised unexpectedly: {e}")

    def test_validate_stock_sentiment_json_missing_keys(self) -> None:
        """validate_stock_sentiment_json should skip items with missing required keys."""
        print("Testing validate_stock_sentiment_json with missing keys...")
        data = [{"symbol": "AAPL", "sentiment_label": "Positive"}]  # Missing score/confidence
        result = validate_stock_sentiment_json(data)
        # Item is missing required keys → should be filtered out.
        assert result == [], f"Expected empty list, got: {result}"
        print("Passed: validate_stock_sentiment_json with missing keys")

    def test_validate_stock_sentiment_json_valid(self) -> None:
        """validate_stock_sentiment_json should accept well-formed items."""
        print("Testing validate_stock_sentiment_json with valid data...")
        data = [{
            "symbol": "AAPL",
            "sentiment_score": 0.8,
            "sentiment_confidence": 0.9,
            "sentiment_label": "BUY",
            "key_rationale": "Strong earnings",
        }]
        result = validate_stock_sentiment_json(data)
        assert len(result) == 1
        assert result[0]["symbol"] == "AAPL"
        print("Passed: validate_stock_sentiment_json with valid data")

    def test_validate_stock_sentiment_json_wraps_single_dict(self) -> None:
        """validate_stock_sentiment_json should wrap a bare dict in a list."""
        print("Testing validate_stock_sentiment_json with single dict input...")
        data = {
            "symbol": "TSLA",
            "sentiment_score": -0.3,
            "sentiment_confidence": 0.7,
            "sentiment_label": "SELL",
            "key_rationale": "Weak demand",
        }
        result = validate_stock_sentiment_json(data)
        assert len(result) == 1
        assert result[0]["symbol"] == "TSLA"
        print("Passed: validate_stock_sentiment_json wraps single dict")

    def test_data_handler_clean_text(self) -> None:
        """DataHandler.optimize_for_llm should handle None/missing selftext safely."""
        print("Testing DataHandler._clean_text safety...")
        dh = DataHandler()

        # Case 1: selftext is None
        res = dh.optimize_for_llm({"title": "Title", "selftext": None})
        assert res["selftext"] == ""

        # Case 2: selftext missing, body is None
        res = dh.optimize_for_llm({"title": "Title", "body": None})
        assert res["selftext"] == ""

        print("Passed: DataHandler safe text extraction")


if __name__ == "__main__":
    unittest.main()
