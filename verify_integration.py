import asyncio
from pathlib import Path
from main import run_llm_analysis
import os

# Setup dummy input
input_dir = Path("stock_data/llm_input")
input_dir.mkdir(parents=True, exist_ok=True)
dummy_file = input_dir / "test_context.txt"
dummy_file.write_text("P:[100] TSLA is going to the moon\nB: Everyone is buying TSLA calls.\nC:\n>[50] Agreed.\n", encoding="utf-8")

# Set dummy API key if not present (although Mistral Client might fail auth if it tries to hit real API)
# If the user has a real key in env, it will use it. If not, it will fail. 
# But let's assume valid key or just check if it runs without syntax error.
if "MISTRAL_API_KEY" not in os.environ:
    os.environ["MISTRAL_API_KEY"] = "dummy"

async def test():
    print("Running LLM Analysis Integration Test...")
    try:
        await run_llm_analysis()
        print("Analysis completed.")
        
        # Check output
        output_dir = Path("stock_data/llm_output")
        output_file = output_dir / "test_context_analysis.csv"
        
        if output_file.exists():
            print(f"SUCCESS: Output file created at {output_file}")
            # print(output_file.read_text(encoding="utf-8"))
        else:
            print("FAILURE: No output file created.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
