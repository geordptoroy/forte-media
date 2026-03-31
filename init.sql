CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads (
    id VARCHAR(255) PRIMARY KEY,
    page_id VARCHAR(255) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    creative_url TEXT,
    spend_range VARCHAR(50),
    impressions_range VARCHAR(50),
    days_active INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    is_scaled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_snapshots (
    id SERIAL PRIMARY KEY,
    ad_id VARCHAR(255) REFERENCES ads(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    spend_range VARCHAR(50),
    impressions_range VARCHAR(50),
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ad_id VARCHAR(255) REFERENCES ads(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) DEFAULT 'Geral',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ad_id)
);

CREATE TABLE IF NOT EXISTS monitoring (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ad_id VARCHAR(255) REFERENCES ads(id) ON DELETE CASCADE,
    alert_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ad_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
    BEFORE UPDATE ON ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ads_score ON ads(score DESC);
CREATE INDEX idx_ads_is_scaled ON ads(is_scaled);
CREATE INDEX idx_ad_snapshots_ad_id ON ad_snapshots(ad_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_monitoring_user_id ON monitoring(user_id);
