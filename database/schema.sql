CREATE TABLE platforms (
    platform_id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE 
);

CREATE TABLE assets (
    asset_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL UNIQUE, 
    asset_name VARCHAR(255),
    asset_type VARCHAR(50)
);

CREATE TABLE asset_mentions (
    mention_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(asset_id),
    platform_id SMALLINT REFERENCES platforms(platform_id),
    sentiment_score NUMERIC(5, 4), 
    confidence_level NUMERIC(5, 4), 
    source_text_id VARCHAR(50),
    source_text_snippet TEXT,
    key_rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL
);