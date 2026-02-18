import pandas as pd
from typing import List, Dict, Optional
from utils.logger import get_logger

log = get_logger(__name__)

def parse_llm_json_to_df(data: List[Dict]) -> Optional[pd.DataFrame]:
    """
    Converts a list of dictionaries (from LLM JSON output) into a pandas DataFrame.
    """
    if not data:
        log.warning("No data provided to parser.")
        return None

    try:
        df = pd.DataFrame(data)
        
        # Normalize columns if needed (though validating in Client should prevent this)
        # Expected keys: symbol, sentiment_score, sentiment_confidence, sentiment_label, key_rationale
        
        # Ensure numeric types
        if "sentiment_score" in df.columns:
            df["sentiment_score"] = pd.to_numeric(df["sentiment_score"], errors='coerce')
            
        if "sentiment_confidence" in df.columns:
            df["sentiment_confidence"] = pd.to_numeric(df["sentiment_confidence"], errors='coerce')
            
        # Rename columns to match old CSV schema if consistency is desired, 
        # OR keep snake_case. Let's map to Title Case to match previous CSV output for downstream compatibility
        # Previous Schema: Symbol, Sentiment_Score, Sentiment_Confidence, Sentiment_Label, Key_Rationale
        
        column_map = {
            "symbol": "Symbol",
            "sentiment_score": "Sentiment_Score",
            "sentiment_confidence": "Sentiment_Confidence",
            "sentiment_label": "Sentiment_Label",
            "key_rationale": "Key_Rationale"
        }
        
        df = df.rename(columns=column_map)
        
        # Drop rows with critical NaNs if columns exist
        cols_to_check = [c for c in ["Sentiment_Score", "Sentiment_Confidence"] if c in df.columns]
        if cols_to_check:
            df = df.dropna(subset=cols_to_check)
        
        return df

    except Exception as e:
        log.error(f"Failed to convert JSON data to DataFrame: {e}")
        return None
