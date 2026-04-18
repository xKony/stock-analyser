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

# ---------------------------------------------------------------------------
# Bootstrap path so we can import from the project root
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from supabase import Client, create_client  # noqa: E402
from config import SUPABASE_URL, SUPABASE_KEY  # noqa: E402
from utils.logger import get_logger  # noqa: E402

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


SEED_BATCH_SIZE: Final[int] = 500  # rows per Supabase batch insert

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


def get_or_create(
    client: Client, table: str, search: dict[str, Any], data: dict[str, Any], id_col: str
) -> int | None:
    """Fetch existing row or insert a new one; returns the id."""
    try:
        q = client.table(table).select("*")
        for k, v in search.items():
            q = q.eq(k, v)
        resp = q.execute()
        if resp.data:
            return int(resp.data[0][id_col])

        resp = client.table(table).insert(data).execute()
        if resp.data:
            return int(resp.data[0][id_col])
    except Exception as exc:
        log.error(f"get_or_create({table}) failed: {exc}")
    return None


# ---------------------------------------------------------------------------
# Core seed logic
# ---------------------------------------------------------------------------

def clear_seed_data(client: Client) -> None:
    """Delete all existing `asset_mentions` rows (cascades OK with schema)."""
    log.info("Clearing existing asset_mentions...")
    try:
        # Delete everything — Supabase requires a filter; use "> 0" on PK
        client.table("asset_mentions").delete().gt("mention_id", 0).execute()
        log.info("asset_mentions cleared.")
    except Exception as exc:
        log.error(f"Failed to clear asset_mentions: {exc}")


def seed(days: int = 30, clear: bool = False) -> None:
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.critical("SUPABASE_URL / SUPABASE_KEY not set. Check your .env file.")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info("Connected to Supabase.")

    if clear:
        clear_seed_data(client)

    # ---- Resolve / create platforms ----------------------------------------
    platform_ids: dict[str, int] = {}
    for platform in PLATFORMS:
        pid = get_or_create(
            client,
            table="platforms",
            search={"name": platform.name},
            data={"name": platform.name},
            id_col="platform_id",
        )
        if pid is None:
            log.error(f"Could not resolve platform '{platform.name}'. Skipping.")
            continue
        platform_ids[platform.name] = pid
        log.info(f"  Platform '{platform.name}' -> id={pid}")

    # ---- Resolve / create assets -------------------------------------------
    asset_ids: dict[str, int] = {}
    asset_biases: dict[str, float] = {}
    for asset in ASSETS:
        aid = get_or_create(
            client,
            table="assets",
            search={"ticker": asset.ticker, "asset_type": asset.asset_type},
            data={"ticker": asset.ticker, "asset_type": asset.asset_type, "asset_name": asset.asset_name},
            id_col="asset_id",
        )
        if aid is None:
            log.error(f"Could not resolve asset '{asset.ticker}'. Skipping.")
            continue
        asset_ids[asset.ticker] = aid
        asset_biases[asset.ticker] = asset.bias
        log.info(f"  Asset '{asset.ticker}' ({asset.asset_type}) -> id={aid}")

    # ---- Generate mentions --------------------------------------------------
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    total_steps = days * SAMPLES_PER_DAY  # walk length per ticker/platform combo

    all_rows: list[dict] = []

    for ticker, asset_id in asset_ids.items():
        bias = asset_biases[ticker]
        for platform_name, platform_id in platform_ids.items():
            # Each ticker×platform pair gets its own independent walk
            walk = biased_random_walk(
                steps=total_steps,
                bias=bias,
                # Crypto is more volatile
                volatility=0.18 if ticker in ("BTC", "ETH") else 0.10,
            )

            for step_idx, score in enumerate(walk):
                # Distribute samples across the date range
                days_offset = step_idx / SAMPLES_PER_DAY
                hours_offset = (step_idx % SAMPLES_PER_DAY) * (24 // SAMPLES_PER_DAY)
                ts = start_date + timedelta(days=days_offset, hours=hours_offset)

                # Add small intra-day jitter (±15 min)
                ts += timedelta(minutes=random.randint(-15, 15))

                all_rows.append({
                    "asset_id": asset_id,
                    "platform_id": platform_id,
                    "sentiment_score": score,
                    "confidence_level": confidence_from_score(score),
                    "created_at": ts.isoformat(),
                })

    # ---- Batch insert -------------------------------------------------------
    random.shuffle(all_rows)  # mix up insertion order for realistic timestamps
    total = len(all_rows)
    inserted = 0

    log.info(f"Inserting {total} mention rows in batches of {SEED_BATCH_SIZE}...")
    for i in range(0, total, SEED_BATCH_SIZE):
        batch = all_rows[i : i + SEED_BATCH_SIZE]
        try:
            client.table("asset_mentions").insert(batch).execute()
            inserted += len(batch)
            log.info(f"  Inserted {inserted}/{total} rows...")
        except Exception as exc:
            log.error(f"Batch insert failed at offset {i}: {exc}")

    log.info(f"Done. {inserted} rows seeded across {len(asset_ids)} assets and {len(platform_ids)} platforms.")
    log.info(f"Date range: {start_date.date()} → {now.date()} ({days} days)")


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
