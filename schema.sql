-- Liquid Credits PostgreSQL Schema
-- Setup users, wallets, and unalterable financial ledger tables.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 500000000, -- credit balance in micro-units ($500.00 USD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL, -- positive for credits added, negative for credits deducted
    type VARCHAR(50) NOT NULL, -- e.g., 'grant', 'charge', 'refund'
    provider VARCHAR(50), -- e.g., 'openai', 'anthropic', 'flux', 'elevenlabs'
    model VARCHAR(50), -- e.g., 'gpt-4o', 'flux-1-dev', etc.
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    credits_charged BIGINT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to ensure ledger_entries is strictly insert-only (unalterable ledger)
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries are unalterable.';
END;
$$ LANGUAGE plpgsql;

-- Apply update block trigger
DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON ledger_entries;
CREATE TRIGGER trg_prevent_ledger_update
BEFORE UPDATE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- Apply delete block trigger
DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON ledger_entries;
CREATE TRIGGER trg_prevent_ledger_delete
BEFORE DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();
