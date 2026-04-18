"""
seed_database.py
~~~~~~~~~~~~~~~~
Populate the Supabase database with realistic synthetic sentiment data
for frontend development and testing.

Usage
-----
    # Seed 30 days of data (default)
    python scripts/seed_database.py

    # Seed a custom range
    python scripts/seed_database.py --days 60

    # Wipe all seeded data first, then re-seed
    python scripts/seed_database.py --clear

    # Both
    python scripts/seed_database.py --clear --days 14
"""

import argparse
import math
import random
import sys
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Final
from utils.logger import get_logger

# ---------------------------------------------------------------------------
# Bootstrap path so we can import from the project root
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data.models import SentimentRecord  # noqa: E402
from database.supabase_client import SupabaseClient  # noqa: E402

log = get_logger(__name__)

# ---------------------------------------------------------------------------
# Seed configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class AssetConfig:
    ticker: str
    asset_type: str
    asset_name: str
    bias: float


@dataclass(frozen=True)
class PlatformConfig:
    name: str


PLATFORMS: Final[list[PlatformConfig]] = [
    PlatformConfig("Reddit/stocks"),
    PlatformConfig("Reddit/wallstreetbets"),
    PlatformConfig("Reddit/investing"),
]

ASSETS: Final[list[AssetConfig]] = [
    # bias: gentle directional drift so charts look interesting
    AssetConfig("AAPL",  "Stock",     "Apple Inc.",         +0.02),
    AssetConfig("TSLA",  "Stock",     "Tesla Inc.",          -0.03),
    AssetConfig("NVDA",  "Stock",     "NVIDIA Corporation",  +0.04),
    AssetConfig("MSFT",  "Stock",     "Microsoft Corporation",+0.02),
    AssetConfig("AMZN",  "Stock",     "Amazon.com Inc.",     +0.01),
    AssetConfig("GOOGL", "Stock",     "Alphabet Inc.",        0.00),
    AssetConfig("AMD",   "Stock",     "Advanced Micro Devices",-0.01),
    AssetConfig("META",  "Stock",     "Meta Platforms Inc.", +0.03),
    AssetConfig("BTC",   "Crypto",    "Bitcoin",             +0.05),
    AssetConfig("ETH",   "Crypto",    "Ethereum",            +0.03),
    AssetConfig("XAU",   "Commodity", "Gold",               -0.01),
]


# Samples per ticker per platform per day
SAMPLES_PER_DAY: Final[int] = 3


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def biased_random_walk(
    steps: int,
    bias: float = 0.0,
    volatility: float = 0.12,
    *,
    clamp_min: float = -1.0,
    clamp_max: float = 1.0,
    start: float | None = None,
) -> list[float]:
    """Return a list of *steps* sentiment values using a biased random walk.

    The walk starts near 0 (or *start*), drifts according to *bias*, and is
    clamped to ``[clamp_min, clamp_max]``.
    """
    if start is None:
        start = random.uniform(-0.15, 0.15)
    values: list[float] = [start]
    for _ in range(steps - 1):
        delta = bias + random.gauss(0, volatility)
        next_val = max(clamp_min, min(clamp_max, values[-1] + delta))
        values.append(round(next_val, 4))
    return values


def confidence_from_score(score: float) -> float:
    """Higher confidence for stronger (more extreme) sentiment."""
    base = abs(score)
    noise = random.uniform(-0.05, 0.05)
    return round(max(0.0, min(1.0, 0.4 + base * 0.55 + noise)), 4)


# ---------------------------------------------------------------------------
# Core seed logic
# ---------------------------------------------------------------------------

def generate_records(
    platform: PlatformConfig,
    assets: list[AssetConfig],
    days: int,
) -> list[SentimentRecord]:
    """Generate synthetic historical records for a specific platform."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    total_steps = days * SAMPLES_PER_DAY

    records: list[SentimentRecord] = []

    for asset in assets:
        # Each ticker×platform pair gets its own independent walk
        walk = biased_random_walk(
            steps=total_steps,
            bias=asset.bias,
            volatility=0.18 if asset.asset_type == "Crypto" else 0.10,
        )

        for step_idx, score in enumerate(walk):
            # Distribute samples across the date range
            days_offset = step_idx / SAMPLES_PER_DAY
            hours_offset = (step_idx % SAMPLES_PER_DAY) * (24 // SAMPLES_PER_DAY)
            ts = start_date + timedelta(days=days_offset, hours=hours_offset)

            # Add small intra-day jitter (±15 min)
            ts += timedelta(minutes=random.randint(-15, 15))

            records.append(SentimentRecord(
                symbol=asset.ticker,
                sentiment_score=score,
                sentiment_confidence=confidence_from_score(score),
                sentiment_label="BUY" if score > 0.3 else ("SELL" if score < -0.3 else "NEUTRAL"),
                key_rationale=f"Synthetic data generated for {asset.ticker}",
                created_at=ts,
                source_name=platform.name.lower()
            ))
    
    return records


def seed(days: int = 30, clear: bool = False) -> None:
    db = SupabaseClient()
    log.info(f"Connected to Supabase. Seeding {days} days of data.")

    if clear:
        db.clear_mentions()

    # Pre-populate assets if they don't exist
    # SupabaseClient.insert_analysis already handles this if we pass records,
    # but we might want to ensure names are correct.
    
    for platform in PLATFORMS:
        log.info(f"Generating and inserting records for platform: {platform.name}")
        records = generate_records(platform, ASSETS, days)
        random.shuffle(records)  # mix up insertion order for realism
        db.insert_analysis(records, platform.name)

    log.info("Seeding complete.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed Supabase with synthetic sentiment data for local development."
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Number of days of historical data to generate (default: 30).",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Wipe existing asset_mentions before seeding.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    seed(days=args.days, clear=args.clear)
