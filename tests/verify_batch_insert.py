import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from database.supabase_client import SupabaseClient

class TestBatchInsert(unittest.TestCase):
    @patch("database.supabase_client.create_client")
    def test_insert_analysis_batch(self, mock_create_client):
        print("Testing insert_analysis batch execution...")
        
        # Setup Client
        with patch.dict(os.environ, {"SUPABASE_URL": "http://test", "SUPABASE_KEY": "test"}):
            client = SupabaseClient()
            
            # Mock platform/asset resolution
            # We want _get_or_create to return IDs
            client._get_or_create = MagicMock(side_effect=[
                100, # Platform ID
                201, # Asset ID for AAPL
                202, # Asset ID for TSLA
            ])
            
            # Mock Table interactions
            mock_table = MagicMock()
            client.client.table = MagicMock(return_value=mock_table)
            mock_execute = MagicMock()
            mock_table.insert.return_value = mock_execute
            
            # Test Data
            analysis_data = [
                {"symbol": "AAPL", "sentiment_score": 0.5, "sentiment_confidence": 0.8},
                {"symbol": "TSLA", "sentiment_score": -0.2, "sentiment_confidence": 0.6}
            ]
            
            # Execute
            client.insert_analysis(analysis_data, "TestPlatform")
            
            # Verification
            # 1. Check _get_or_create calls
            # Expect 1 platform call + 2 asset calls
            assert client._get_or_create.call_count == 3
            
            # 2. Check insert call
            # Should be called ONCE with a list of 2 items
            mock_table.insert.assert_called_once()
            
            args, _ = mock_table.insert.call_args
            inserted_data = args[0]
            
            assert isinstance(inserted_data, list)
            assert len(inserted_data) == 2
            assert inserted_data[0]["asset_id"] == 201
            assert inserted_data[1]["asset_id"] == 202
            assert inserted_data[0]["platform_id"] == 100
            
            print("Batch insert verification passed!")

if __name__ == "__main__":
    unittest.main()
