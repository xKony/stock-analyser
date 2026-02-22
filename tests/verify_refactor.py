import sys
import os
import unittest
from unittest.mock import MagicMock, patch, AsyncMock, PropertyMock

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from LLM.base_llm import BaseLLM
from LLM.gemini_client import GeminiClient
from LLM.mistral_client import MistralClient
from database.supabase_client import SupabaseClient


# ---------------------------------------------------------------------------
# Sync tests
# ---------------------------------------------------------------------------

class TestRefactorSync(unittest.TestCase):
    """Tests that do not require an event loop."""

    def test_base_llm_inheritance(self):
        print("Testing BaseLLM inheritance...")
        self.assertTrue(issubclass(GeminiClient, BaseLLM))
        self.assertTrue(issubclass(MistralClient, BaseLLM))
        print("Inheritance check passed.")

    @patch("database.supabase_client.create_client")
    def test_supabase_generic_method(self, mock_create_client):
        print("Testing Supabase generic method...")
        with patch.dict(os.environ, {"SUPABASE_URL": "http://test", "SUPABASE_KEY": "test"}):
            client = SupabaseClient()

            mock_table = MagicMock()
            client.client.table = MagicMock(return_value=mock_table)

            mock_execute = MagicMock()
            mock_execute.data = [{"platform_id": 123}]

            mock_query = MagicMock()
            mock_query.eq.return_value = mock_query
            mock_query.execute.return_value = mock_execute
            mock_table.select.return_value = mock_query

            result_id = client._get_or_create(
                "platforms", {"name": "Reddit"}, {"name": "Reddit"}, id_column="platform_id"
            )
            self.assertEqual(result_id, 123)

            # Insert path: first select returns empty, insert returns new ID.
            mock_execute_empty = MagicMock()
            mock_execute_empty.data = []
            mock_query.execute.return_value = mock_execute_empty

            mock_execute_insert = MagicMock()
            mock_execute_insert.data = [{"platform_id": 456}]
            mock_insert_query = MagicMock()
            mock_insert_query.execute.return_value = mock_execute_insert
            mock_table.insert.return_value = mock_insert_query

            result_id_new = client._get_or_create(
                "platforms", {"name": "New"}, {"name": "New"}, id_column="platform_id"
            )
            self.assertEqual(result_id_new, 456)
            print("Supabase generic method passed.")


# ---------------------------------------------------------------------------
# Async tests
# ---------------------------------------------------------------------------

class TestRefactorAsync(unittest.IsolatedAsyncioTestCase):
    """Tests that require an event loop."""

    @patch("LLM.gemini_client.genai")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_gemini_client_flow(self, mock_load_prompt, mock_genai):
        print("Testing GeminiClient flow...")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"}):
            client = GeminiClient(rpm=100, rpd=1000)

            mock_response = MagicMock()
            mock_response.text = (
                '```json\n'
                '[{"symbol": "TEST", "sentiment_score": 0.8, '
                '"sentiment_confidence": 0.9, "sentiment_label": "positive", '
                '"key_rationale": "good"}]\n'
                '```'
            )
            mock_response.candidates = [MagicMock()]
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)

            result = await client.get_response("test input")

            self.assertEqual(client.system_prompt, "test prompt")
            self.assertIsNotNone(result)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].symbol, "TEST")
            print("GeminiClient flow passed.")

    @patch("LLM.gemini_client.genai")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_gemini_safety_block(self, mock_load_prompt, mock_genai):
        print("Testing GeminiClient safety block...")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"}):
            client = GeminiClient(rpm=100, rpd=1000)

            # Scenario 1: empty candidates
            mock_response = MagicMock()
            mock_response.candidates = []
            mock_response.prompt_feedback = "BLOCKED"
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)

            result = await client.get_response("input")
            self.assertIsNone(result)

            # Scenario 2: .text raises ValueError
            mock_response.candidates = [MagicMock()]
            type(mock_response).text = PropertyMock(side_effect=ValueError("Safety"))
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)

            result = await client.get_response("input")
            self.assertIsNone(result)
            print("GeminiClient safety block verification passed.")

    @patch("LLM.mistral_client.Mistral")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_mistral_client_flow(self, mock_load_prompt, mock_mistral):
        print("Testing MistralClient flow...")
        with patch.dict(os.environ, {"MISTRAL_API_KEY": "test_key"}):
            client = MistralClient(rpm=100, rpd=1000)

            mock_response = MagicMock()
            mock_choice = MagicMock()
            mock_choice.message.content = (
                '```json\n'
                '[{"symbol": "MISTRAL", "sentiment_score": -0.5, '
                '"sentiment_confidence": 0.8, "sentiment_label": "negative", '
                '"key_rationale": "bad"}]\n'
                '```'
            )
            mock_response.choices = [mock_choice]
            client.client.chat.complete_async = AsyncMock(return_value=mock_response)

            result = await client.get_response("test input")

            self.assertIsNotNone(result)
            self.assertEqual(len(result), 1)
            self.assertEqual(result[0].symbol, "MISTRAL")
            print("MistralClient flow passed.")

    @patch("utils.rate_limiter.asyncio.to_thread")
    async def test_rate_limiter_async_save(self, mock_to_thread):
        print("Testing RateLimiter async save...")
        from utils.rate_limiter import RateLimiter

        with patch("builtins.open", unittest.mock.mock_open(read_data="{}")):
            with patch("os.path.exists", return_value=True):
                rl = RateLimiter("test_async", 10, 100)
                rl._save_state_sync = MagicMock()

                await rl.check_and_acquire()

                mock_to_thread.assert_called_with(rl._save_state_sync)
                print("RateLimiter async save verification passed.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
