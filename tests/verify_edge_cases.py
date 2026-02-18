import sys
import os
import pandas as pd
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.getcwd())

from main import _cleanup_directories
from utils.json_parser import parse_llm_json_to_df
from data.data_handler import DataHandler

def test_cleanup_directories():
    print("Testing _cleanup_directories...")
    # Should not raise error for non-existent dir
    non_existent_path = Path("non_existent_dir_12345")
    try:
        _cleanup_directories(non_existent_path, non_existent_path)
        print("Passed: _cleanup_directories with non-existent path")
    except Exception as e:
        print(f"Failed: _cleanup_directories raised {e}")

def test_json_parser_missing_cols():
    print("Testing parse_llm_json_to_df with missing columns...")
    data = [{"symbol": "AAPL", "sentiment_label": "Positive"}] # Missing Score/Confidence
    df = parse_llm_json_to_df(data)
    
    # Should return dataframe but maybe empty if dropna removed everything, 
    # OR if my fix works, it shouldn't crash.
    # Logic: cols_to_check = [c for c in ["Sentiment_Score", "Sentiment_Confidence"] if c in df.columns]
    # Here neither exists, so cols_to_check is empty, so dropna is NOT called.
    # So it should return df with existing columns.
    
    assert "Symbol" in df.columns
    assert "Sentiment_Label" in df.columns
    assert "Sentiment_Score" not in df.columns # Wasn't in input
    print("Passed: parse_llm_json_to_df with missing columns")

def test_data_handler_clean_text():
    print("Testing DataHandler._clean_text safety...")
    dh = DataHandler()
    
    # Case 1: selftext is None (key exists, value None)
    post_data_none = {"title": "Title", "selftext": None}
    res = dh.optimize_for_llm(post_data_none)
    assert res["selftext"] == ""
    
    # Case 2: selftext missing, body None
    post_data_body_none = {"title": "Title", "body": None}
    res = dh.optimize_for_llm(post_data_body_none)
    assert res["selftext"] == ""
    
    print("Passed: DataHandler safe text extraction")

if __name__ == "__main__":
    test_cleanup_directories()
    test_json_parser_missing_cols()
    test_data_handler_clean_text()
    print("All edge case verification tests passed!")
