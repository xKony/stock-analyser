# 📈 Stock Analyser

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2.4-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

Stock Analyser is an end-to-end data pipeline that automates the collection of financial discussions from Reddit, extracts sentiment for specific stock tickers using Large Language Models (Gemini or Mistral), and visualises the results in a modern Next.js dashboard.

[↑ Back to top](#-stock-analyser)

## ✨ Features

- **Automated Data Ingestion**: Asynchronous scraping of 7 major finance subreddits (stocks, wallstreetbets, investing, etc.) with customisable flair and score filters.
- **LLM-Powered Sentiment Analysis**: Precision extraction of per-ticker sentiment scores, confidence levels, and rationales using Google Gemini or Mistral AI.
- **Incremental Pipeline**: Smart data handling that deduplicates records and skips already-processed files to minimize API costs and redundant computations.
- **Normalised Data Model**: Robust 3-table PostgreSQL schema in Supabase (`platforms`, `assets`, `asset_mentions`) with full relational integrity.
- **Interactive Dashboard**: Real-time visualization of market mood, including:
    - **Sentiment Trends**: Interactive time-series charts using Recharts.
    - **Top Stocks**: Dynamic tables showing most-mentioned assets and their average sentiment.
    - **Market Stats**: High-level metrics for total mentions, tracked assets, and global sentiment.
- **Developer-Friendly Tooling**: Extensive test suite for pipeline verification and a synthetic data seeding script for local frontend development.

[↑ Back to top](#-stock-analyser)

## 🛠 Tech Stack

### Backend (Data Pipeline)
- **Language**: Python 3.11+
- **Reddit API**: `asyncpraw` (asynchronous wrapper for PRAW)
- **AI/LLM**: Google Gemini (`gemma-4-31b-it`) and Mistral AI (`mistral-small-latest`)
- **Database**: Supabase (PostgreSQL) via `supabase-py`
- **Environment**: `python-dotenv`

### Frontend (Dashboard)
- **Framework**: Next.js 16.2.4 (App Router)
- **UI Library**: React 19.2.5
- **Styling**: Tailwind CSS v4.0 (Modern Dark-Mode Design)
- **Visualisation**: Recharts ^3.7.0
- **Animations**: Framer Motion ^12.34.0
- **Icons**: Lucide React ^0.564.0
- **Utilities**: `clsx`, `tailwind-merge`, `date-fns`

### Infrastructure & Tools
- **Database**: Supabase (PostgreSQL)
- **Containerisation**: Docker Compose (Local PostgreSQL)
- **Package Manager**: pnpm (Frontend)

[↑ Back to top](#-stock-analyser)

## 📁 Project Structure

```text
.
├── data/               # Reddit ingestion and data normalization
├── database/           # Supabase client and PostgreSQL schema.sql
├── frontend/           # Next.js dashboard application
│   ├── src/app/        # App Router pages and API routes
│   ├── src/components/ # React components (Dashboard, UI, Layout)
│   └── src/lib/        # Shared frontend utilities and Supabase clients
├── LLM/                # Provider-agnostic LLM orchestration (Gemini/Mistral)
├── logs/               # Rate limit state and application logs
├── scripts/            # Database seeding and maintenance scripts
├── stock_data/         # Intermediate JSON files for the pipeline
├── tests/              # Comprehensive integration and logical tests
├── utils/              # Shared Python utilities (logger, rate-limiter)
├── main.py             # Pipeline entry point
├── config.py           # Global backend configuration
└── docker-compose.yml  # Local database infrastructure
```

[↑ Back to top](#-stock-analyser)

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 20+**
- **pnpm** (Recommended for frontend)
- **Docker** (Optional, for local DB testing)

### 1. Environment Setup
Clone the repository and create a `.env` file in the root:
```bash
cp .env.example .env
```
Configure your credentials:
- **Reddit**: `CLIENT_ID`, `CLIENT_SECRET`, `USER_AGENT`
- **AI Providers**: `GEMINI_API_KEY` (or `MISTRAL_API_KEY`)
- **Supabase**: `SUPABASE_URL`, `SUPABASE_KEY`

### 2. Backend Installation
Install the required Python packages:
```bash
# Recommendation: use a virtual environment
pip install -r requirements.txt
```

### 3. Database Initialization
Run the schema in your Supabase SQL editor (found in `database/schema.sql`) or seed synthetic data for the frontend:
```bash
python scripts/seed_database.py --days 30
```

### 4. Running the Pipeline
```bash
# Run the full scrape -> analyse -> persist loop
python main.py

# Run in test mode (single random subreddit)
python main.py --test
```

### 5. Frontend Installation
```bash
cd frontend
pnpm install
pnpm dev
```
The dashboard will be available at `http://localhost:3000`.

[↑ Back to top](#-stock-analyser)

## 📖 Usage

### Core Commands
- `python main.py`: Execute the full data pipeline.
- `python main.py --test`: Process only one random subreddit for quick verification.
- `python main.py --parse-only <file>`: Re-parse a saved LLM output without re-scraping.
- `pnpm dev`: Start the Next.js development server.
- `pnpm build`: Create a production build of the dashboard.

[↑ Back to top](#-stock-analyser)

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

[↑ Back to top](#-stock-analyser)
