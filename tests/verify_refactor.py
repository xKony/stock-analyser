import sys
import os
import asyncio
import unittest
from unittest.mock import MagicMock, patch, AsyncMock, PropertyMock

# Add project root to path
sys.path.append(os.getcwd())

from LLM.base_llm import BaseLLM
from LLM.gemini_client import GeminiClient
from LLM.mistral_client import MistralClient
from database.supabase_client import SupabaseClient

class TestRefactor(unittest.TestCase):
    def test_base_llm_inheritance(self):
        print("Testing BaseLLM inheritance...")
        assert issubclass(GeminiClient, BaseLLM)
        assert issubclass(MistralClient, BaseLLM)
        print("Inheritance check passed.")

    @patch("LLM.gemini_client.genai")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_gemini_client_flow(self, mock_load_prompt, mock_genai):
        print("Testing GeminiClient flow...")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"}):
            client = GeminiClient(rpm=100, rpd=1000)
            
            # Mock the raw response
            mock_response = MagicMock()
            mock_response.text = '```json\n[{"symbol": "TEST", "sentiment_score": 0.8, "sentiment_confidence": 0.9, "sentiment_label": "positive", "key_rationale": "good"}]\n```'
            
            # Mock the asyncio call chain
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
            
            result = await client.get_response("test input")
            
            assert client.system_prompt == "test prompt"
            assert result is not None
            assert len(result) == 1
            assert result[0]["symbol"] == "TEST"
            print("GeminiClient flow passed.")

    @patch("LLM.gemini_client.genai")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_gemini_safety_block(self, mock_load_prompt, mock_genai):
        print("Testing GeminiClient safety block...")
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"}):
            client = GeminiClient(rpm=100, rpd=1000)
            
            # Mock a blocked response (no text access)
            mock_response = MagicMock()
            # Simulate no candidates or candidates with finish_reason != STOP
            # Actually, our code checks `if not response.candidates` OR access `.text` raises ValueError
            
            # Scenario 1: Empty candidates
            mock_response.candidates = []
            mock_response.prompt_feedback = "BLOCKED"
            
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
            
            result = await client.get_response("input")
            assert result is None
            
            # Scenario 2: Candidates exist but .text raises ValueError
            mock_response.candidates = [MagicMock()]
            type(mock_response).text = PropertyMock(side_effect=ValueError("Safety"))
            
            client.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
            
            result = await client.get_response("input")
            assert result is None
            
            print("GeminiClient safety block verification passed.")

    @patch("LLM.mistral_client.Mistral")
    @patch("LLM.base_llm.load_prompt", return_value="test prompt")
    async def test_mistral_client_flow(self, mock_load_prompt, mock_mistral):
        print("Testing MistralClient flow...")
        with patch.dict(os.environ, {"MISTRAL_API_KEY": "test_key"}):
            client = MistralClient(rpm=100, rpd=1000)
            
            # Mock the raw response logic
            # Mistral response structure varies, let's mock the choices attribute access
            mock_response = MagicMock()
            mock_choice = MagicMock()
            mock_choice.message.content = '```json\n[{"symbol": "MISTRAL", "sentiment_score": -0.5, "sentiment_confidence": 0.8, "sentiment_label": "negative", "key_rationale": "bad"}]\n```'
            mock_response.choices = [mock_choice]
            
            client.client.chat.complete_async = AsyncMock(return_value=mock_response)
            
            result = await client.get_response("test input")
            
            assert result is not None
            assert len(result) == 1
            assert result[0]["symbol"] == "MISTRAL"
            print("MistralClient flow passed.")

    @patch("database.supabase_client.create_client")
    def test_supabase_generic_method(self, mock_create_client):
        print("Testing Supabase generic method...")
        with patch.dict(os.environ, {"SUPABASE_URL": "http://test", "SUPABASE_KEY": "test"}):
            client = SupabaseClient()
            
            # Mock the chain: table().select().eq().execute()
            mock_table = MagicMock()
            client.client.table = MagicMock(return_value=mock_table)
            
            # 1. Test returning existing ID
            mock_select = MagicMock()
            mock_eq = MagicMock()
            mock_execute = MagicMock()
            mock_execute.data = [{"platform_id": 123}]
            
            mock_table.select.return_value = mock_select
            mock_select.eq.return_value = mock_select # chainable
            # We need the last call in the chain to verify arguments, but here we just check result logic
            # However, since valid logic requires looping eq, we need to mock it carefully if we want to assert calls.
            # Ideally the mock should return itself for eq() calls.
            
            # Let's just mock query execution result
            # For the generic method: query = self.client.table(table).select("*"); loop eq; execute()
            
            # We need to simulate the implementation of query construction
            # Since `query` is reassigned in the loop `query = query.eq(key, value)`, 
            # the mock object returned by `select()` must support `eq()` returning itself (or another mock).
            mock_query = MagicMock()
            mock_query.eq.return_value = mock_query
            mock_query.execute.return_value = mock_execute
            mock_table.select.return_value = mock_query

            # Call
            result_id = client._get_or_create("platforms", {"name": "Reddit"}, {"name": "Reddit"})
            assert result_id == 123
            
            # 2. Test inserting new record
            # First execute returns empty data
            mock_execute_empty = MagicMock()
            mock_execute_empty.data = []
            
            # Insert execute returns new ID
            mock_execute_insert = MagicMock()
            mock_execute_insert.data = [{"platform_id": 456}]
            
            # We need to control the side_effects of execute()
            # First call (select) -> empty. Second call (insert) -> ID.
            
            # The code:
            # 1. select()...execute()
            # 2. insert().execute()
            
            # Verify insert path
            mock_query.execute.return_value = mock_execute_empty
            mock_table.insert.return_value = mock_query # reuse mock query for simplicity of execute
            # But insert().execute() is a different chain.
            
            mock_insert_query = MagicMock()
            mock_insert_query.execute.return_value = mock_execute_insert
            mock_table.insert.return_value = mock_insert_query
            
            result_id_new = client._get_or_create("platforms", {"name": "New"}, {"name": "New"})
            assert result_id_new == 456
            
            print("Supabase generic method passed.")

    @patch("utils.rate_limiter.asyncio.to_thread")
    async def test_rate_limiter_async_save(self, mock_to_thread):
        print("Testing RateLimiter async save...")
        from utils.rate_limiter import RateLimiter
        
        # We need to mock to_thread to ensure it is called, 
        # but we also want the side effect if we were running real integration.
        # Here we just verify that check_and_acquire calls to_thread.
        
        # create a dummy state file to avoid errors
        with patch("builtins.open", unittest.mock.mock_open(read_data='{}')):
            with patch("os.path.exists", return_value=True):
                rl = RateLimiter("test_async", 10, 100)
                rl._save_state_sync = MagicMock()
                
                await rl.check_and_acquire()
                
                # Verify to_thread was awaited with _save_state_sync
                mock_to_thread.assert_called_with(rl._save_state_sync)
                print("RateLimiter async save verification passed.")

if __name__ == "__main__":
    # Manually run async tests wrapper
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    suite = unittest.TestLoader().loadTestsFromTestCase(TestRefactor)
    
    # We need to run awaitable tests specially or just run them synchronously in wrapper
    # But unittest.TestCase doesn't support async naturally without IsolatedAsyncioTestCase (Python 3.8+)
    # Since we imported asyncio, let's just make a simple runner or modify the class to use IsolatedAsyncioTestCase if available
    # Or just wrap the async calls.
    
    # Simple fix: Use unittest.IsolatedAsyncioTestCase if available, otherwise manual loop run
    if hasattr(unittest, "IsolatedAsyncioTestCase"):
        class AsyncTestRefactor(unittest.IsolatedAsyncioTestCase, TestRefactor):
            pass
        unittest.main(argv=['first-arg-is-ignored'], exit=False)
    else:
        # Fallback for older python (unlikely but safe)
        print("Async tests might need manual running if IsolatedAsyncioTestCase is not present.")
        # We'll just define a manual run function
        test = TestRefactor()
        test.test_base_llm_inheritance()
        test.test_supabase_generic_method()
        loop.run_until_complete(test.test_gemini_client_flow())
        loop.run_until_complete(test.test_gemini_safety_block())
        loop.run_until_complete(test.test_mistral_client_flow())
        loop.run_until_complete(test.test_rate_limiter_async_save())

