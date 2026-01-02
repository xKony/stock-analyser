from dataclasses import dataclass
from typing import Literal

@dataclass
class SentimentRecord:
    symbol: str
    sentiment_score: float
    sentiment_confidence: float
    sentiment_label: Literal["BUY", "SELL", "NEUTRAL"]
    key_rationale: str

    def __post_init__(self):
        # Validate ranges
        if not (-1.0 <= self.sentiment_score <= 1.0):
            raise ValueError(f"Sentiment Score {self.sentiment_score} out of range [-1.0, 1.0]")
        
        if not (0.0 <= self.sentiment_confidence <= 1.0):
            raise ValueError(f"Sentiment Confidence {self.sentiment_confidence} out of range [0.0, 1.0]")
