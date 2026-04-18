# GEMINI.md - Technical Reference

## Project Overview
**Name:** Stock Analyser
**Purpose:** Multi-stage data pipeline for scraping financial sentiment from Reddit, processing it via LLMs (Gemini/Mistral), and visualizing trends in a Next.js dashboard.
**Repository Type:** Hybrid (Python Backend + Next.js Frontend)

## Exact Versions (CRITICAL)
### Runtime & Package Managers
- **Python**: 3.11+ (asyncio based)
- **Node.js**: 20+
- **pnpm**: 9.x+ (confirmed by `pnpm-lock.yaml`)

### Frontend (Next.js)
- **Next.js**: 16.2.4
- **React**: 19.2.5
- **TypeScript**: ^5.0.0
- **Tailwind CSS**: ^4.0.0
- **Framer Motion**: ^12.34.0
- **Recharts**: ^3.7.0
- **Lucide React**: ^0.564.0
- **@supabase/ssr**: ^0.8.0
- **@supabase/supabase-js**: ^2.96.0
- **date-fns**: ^4.1.0

### Backend (Python)
- **asyncpraw**: Latest (Reddit API)
- **supabase**: Latest (Database Client)
- **python-dotenv**: Latest (Configuration)
- **pandas**: Latest (Data Processing)

## Project Structure
```text
/
├── main.py                     # Entry point for the full data pipeline
├── config.py                   # Global backend settings (models, subreddits, filters)
├── database/                   # Database logic
│   ├── schema.sql              # Supabase/PostgreSQL table definitions
│   └── supabase_client.py      # Async Supabase client with batch insert logic
├── data/                       # Data ingestion layer
│   ├── reddit_client.py        # Async PRAW wrapper for scraping subreddits
│   ├── data_handler.py         # File-system storage and data cleaning
│   └── models.py               # Pydantic-like dataclass (SentimentRecord)
├── LLM/                        # LLM Orchestration
│   ├── factory.py              # Provider selection logic
│   ├── base_llm.py             # Abstract base client with rate-limiting
│   ├── gemini_client.py        # Google Gemini implementation
│   └── mistral_client.py       # Mistral AI implementation
├── frontend/                   # Next.js Dashboard
│   ├── src/app/                # App Router (Home, Login, Admin, FAQ)
│   ├── src/components/         # Atomic UI & Dashboard components
│   └── src/lib/                # Supabase SSR & Browser clients
├── utils/                      # Shared utilities
│   ├── logger.py               # Structured logging configuration
│   └── rate_limiter.py         # Sliding-window RPM/RPD enforcer
└── scripts/                    # Maintenance
    └── seed_database.py        # Synthetic data generation for dev
```

## Architecture and Patterns
### Backend Pipeline
1. **Scraping**: `RedditClient` uses `asyncpraw` to fetch top posts and comments concurrently.
2. **Formatting**: `DataHandler` cleans text (non-ASCII removal) and optimizes JSON for LLM token limits.
3. **Analysis**: `LLMFactory` selects `BaseLLM` implementation. Requests are rate-limited via `RateLimiter`.
4. **Persistence**: `SupabaseClient` performs batch upserts into normalized tables.

### Frontend Architecture
- **Rendering**: Next.js App Router (primarily Client Components for interactive charts).
- **Data Fetching**: Route Handlers (`/api/*`) serve as a proxy to Supabase.
- **Styling**: Tailwind CSS v4 with a custom Glassmorphism/Dark-Mode theme.
- **State Management**: React `useState`/`useEffect` for local UI state.

## Available Scripts (Frontend)
- `npm run dev`: Start development server.
- `npm run build`: Build production application.
- `npm run start`: Start production server.
- `npm run lint`: Execute ESLint checks.

## Environment Variables
Defined in `.env.example`:
- `CLIENT_ID`: Reddit OAuth2 ID.
- `CLIENT_SECRET`: Reddit OAuth2 Secret.
- `USER_AGENT`: Custom Reddit user agent.
- `MISTRAL_API_KEY`: Required for Mistral model.
- `GEMINI_API_KEY`: Required for Gemini model.
- `SUPABASE_URL`: Supabase project endpoint.
- `SUPABASE_KEY`: Supabase anon/service role key.

## Key Configuration (`config.py`)
- `ACTIVE_MODEL`: Toggle between `"gemini"` and `"mistral"`.
- `SUBREDDIT_LIST`: List of subreddits to scrape.
- `MIN_SCORE_POST`: Threshold for post quality.
- `TIMEFRAME`: Reddit sort timeframe (default `"day"`).
- `KEEP_RAW_JSON`: Whether to retain temporary scrape files.

## Development Conventions
- **Naming**: 
    - Python: `snake_case` for functions/variables, `PascalCase` for classes.
    - Frontend: `PascalCase` for components, `camelCase` for functions/hooks.
- **Imports**: Frontend uses `@/*` alias pointing to `src/*`.
- **Database**: All financial values use `NUMERIC(5,4)` for precision.

## Known Constraints
- **RPM Limits**: LLM providers are strictly limited (Gemini: 15 RPM free tier).
- **Rate Limit Persistence**: State is stored in `logs/rate_limit_state.json`.
- **ASCII Only**: `REMOVE_NON_ASCII` defaults to `True` to preserve LLM context tokens.
