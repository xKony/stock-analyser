import pandas as pd
import io
import re
from utils.logger import get_logger

log = get_logger(__name__)

def parse_llm_output_to_csv(raw_content: str) -> Optional[pd.DataFrame]:
    """
    Parses the raw text output from the LLM into a pandas DataFrame.
    
    Args:
        raw_content (str): The raw string response from the LLM.
        
    Returns:
        Optional[pd.DataFrame]: A DataFrame containing the parsed data, or None if parsing fails.
    """
    if not raw_content:
        log.warning("Empty content provided for parsing.")
        return None

    try:
        # 1. Clean up Markdown code blocks (```csv ... ```)
        # Look for content between ```csv (or just ```) and ```
        code_block_pattern = r"```(?:csv)?\n(.*?)```"
        match = re.search(code_block_pattern, raw_content, re.DOTALL)
        
        if match:
            csv_content = match.group(1).strip()
            log.debug("Extracted CSV content from markdown code block.")
        else:
            # Fallback: Assume the whole text or the text after some Intro is the CSV
            # Heuristic: look for the header line
            lines = raw_content.splitlines()
            csv_lines = []
            header_found = False
            for line in lines:
                # Naive check for header components
                if "Sentiment_Score" in line and "Sentiment_Confidence" in line:
                    header_found = True
                    csv_lines.append(line)
                elif header_found:
                    # Capture subsequent lines that look like data (non-empty)
                    if line.strip():
                        csv_lines.append(line)
            
            if csv_lines:
                csv_content = "\n".join(csv_lines)
                log.debug(f"Extracted CSV content via heuristic (lines={len(csv_lines)}).")
            else:
                # Last resort: Try parsing the whole thing if it looks structure-ish
                csv_content = raw_content
                log.debug("Attempting to parse raw content directly.")

        # 2. Convert to DataFrame
        # utilizing pandas read_csv with error_bad_lines=False (or on_bad_lines='skip' in newer pandas)
        # We use StringIO to simulate a file
        df = pd.read_csv(io.StringIO(csv_content), on_bad_lines='skip')
        
        # 3. Normalize Columns
        # Strip whitespace from headers
        df.columns = [c.strip() for c in df.columns]
        
        # Ensure we have the expected columns (case-insensitive check could be good, but let's stick to spec)
        expected_cols = ["Symbol", "Sentiment_Score", "Sentiment_Confidence", "Sentiment_Label", "Key_Rationale"]
        
        # Check intersection
        missing = [c for c in expected_cols if c not in df.columns]
        if missing:
             log.warning(f"Parsed CSV missing columns: {missing}. Columns found: {df.columns.tolist()}")
             # Depending on strictness, we might return None or the partial DF. 
             # Let's return what we have but log warning.
        
        return df

    except Exception as e:
        log.error(f"Failed to parse CSV from LLM output: {e}")
        return None
