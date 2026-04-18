from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Literal, Optional


@dataclass
class SentimentRecord:
    """Canonical data contract between the LLM layer and the database layer.

    Enforces type safety and catches schema drift early by validating all
    fields at construction time.
    """

    symbol: str
    sentiment_score: float
    sentiment_confidence: float
    sentiment_label: Literal["BUY", "SELL", "NEUTRAL"]
    key_rationale: str
    source_text_id: Optional[str] = field(default=None)
    source_text_snippet: Optional[str] = field(default=None)
    created_at: Optional[datetime] = field(default=None)
    # Deduplication keys — together prevent re-counting the same post/batch
    # across multiple pipeline runs. source_name differentiates platforms
    # (e.g. 'reddit', 'twitter') so their IDs never collide.
    source_id: Optional[str] = field(default=None)    # post ID or batch filename
    source_name: Optional[str] = field(default=None)  # platform name

    def __post_init__(self) -> None:
        if not (-1.0 <= self.sentiment_score <= 1.0):
            raise ValueError(
                f"sentiment_score {self.sentiment_score} out of range [-1.0, 1.0]"
            )
        if not (0.0 <= self.sentiment_confidence <= 1.0):
            raise ValueError(
                f"sentiment_confidence {self.sentiment_confidence} out of range [0.0, 1.0]"
            )

    # ------------------------------------------------------------------
    # Constructors
    # ------------------------------------------------------------------

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> SentimentRecord:
        """Construct a :class:`SentimentRecord` from a raw LLM output dict.

        Accepts both camelCase and snake_case key variants produced by
        different LLM providers.

        Raises:
            KeyError:   If a required field is absent.
            ValueError: If a numeric field is out of its valid range.
            TypeError:  If a field cannot be coerced to the expected type.
        """
        return cls(
            symbol=str(data["symbol"]),
            sentiment_score=float(
                data.get("sentiment_score") or data.get("Sentiment_Score", 0.0)
            ),
            sentiment_confidence=float(
                data.get("sentiment_confidence") or data.get("Sentiment_Confidence", 0.0)
            ),
            sentiment_label=str(
                data.get("sentiment_label") or data.get("Sentiment_Label", "NEUTRAL")
            ),
            key_rationale=str(
                data.get("key_rationale") or data.get("Key_Rationale", "")
            ),
            source_text_id=str(
                data.get("source_text_id") or data.get("Source_Text_Id", "")
            ) if data.get("source_text_id") or data.get("Source_Text_Id") else None,
            source_text_snippet=str(
                data.get("source_text_snippet") or data.get("Source_Text_Snippet", "")
            ) if data.get("source_text_snippet") or data.get("Source_Text_Snippet") else None,
        )

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def to_db_dict(self) -> Dict[str, Any]:
        """Return a dict shaped for ``SupabaseClient.insert_analysis``.

        Only the fields that ``insert_analysis`` reads are included; the
        ``asset_id``, ``platform_id``, and ``created_at`` columns are
        populated by the client itself.
        """
        return {
            "symbol": self.symbol,
            "sentiment_score": self.sentiment_score,
            "sentiment_confidence": self.sentiment_confidence,
            "sentiment_label": self.sentiment_label,
            "key_rationale": self.key_rationale,
            "source_text_id": self.source_text_id,
            "source_text_snippet": self.source_text_snippet,
        }
