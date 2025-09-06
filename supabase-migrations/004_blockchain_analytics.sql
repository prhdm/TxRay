-- Blockchain Analytics Pipeline Tables
-- Optimized for Taiko Hekla (chainId 167009) analytics

-- Blocks table
CREATE TABLE blocks (
  number bigint PRIMARY KEY,
  hash text NOT NULL UNIQUE,
  parent_hash text NOT NULL,
  timestamp timestamptz NOT NULL,
  gas_limit bigint NOT NULL,
  gas_used bigint NOT NULL,
  miner text NOT NULL,
  difficulty text,
  total_difficulty text,
  size integer,
  base_fee_per_gas bigint,
  finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE transactions (
  hash text PRIMARY KEY,
  block_number bigint NOT NULL REFERENCES blocks(number),
  block_hash text NOT NULL,
  "from" text NOT NULL,
  "to" text,
  value numeric(78,0) DEFAULT 0,
  gas_price bigint,
  gas_limit bigint,
  gas_used bigint,
  max_fee_per_gas bigint,
  max_priority_fee_per_gas bigint,
  input text,
  nonce bigint,
  transaction_index integer NOT NULL,
  status integer,
  contract_address text,
  cumulative_gas_used bigint,
  effective_gas_price bigint,
  type integer DEFAULT 0,
  method text,
  pending boolean DEFAULT false,
  source text DEFAULT 'indexer',
  finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Logs table (event logs)
CREATE TABLE logs (
  id text PRIMARY KEY, -- concat(tx_hash, log_index)
  transaction_hash text NOT NULL REFERENCES transactions(hash),
  block_number bigint NOT NULL REFERENCES blocks(number),
  block_hash text NOT NULL,
  address text NOT NULL, -- contract address
  topics text[] NOT NULL, -- event signature + indexed params
  data text, -- non-indexed params
  log_index integer NOT NULL,
  removed boolean DEFAULT false,
  finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index cursor for tracking sync progress
CREATE TABLE index_cursor (
  id text PRIMARY KEY DEFAULT 'main',
  last_block bigint NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  error_message text,
  retry_count integer DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_blocks_timestamp ON blocks(timestamp);
CREATE INDEX idx_blocks_miner ON blocks(miner);
CREATE INDEX idx_blocks_finalized ON blocks(finalized);

CREATE INDEX idx_transactions_block_number ON transactions(block_number);
CREATE INDEX idx_transactions_from ON transactions("from");
CREATE INDEX idx_transactions_to ON transactions("to");
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_pending ON transactions(pending);
CREATE INDEX idx_transactions_finalized ON transactions(finalized);
CREATE INDEX idx_transactions_method ON transactions(method);
CREATE INDEX idx_transactions_source ON transactions(source);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

CREATE INDEX idx_logs_transaction_hash ON logs(transaction_hash);
CREATE INDEX idx_logs_block_number ON logs(block_number);
CREATE INDEX idx_logs_address ON logs(address);
CREATE INDEX idx_logs_topics ON logs USING gin(topics);
CREATE INDEX idx_logs_finalized ON logs(finalized);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Partial indexes for common queries
CREATE INDEX idx_transactions_pending_false ON transactions(block_number) WHERE pending = false;
CREATE INDEX idx_logs_finalized_true ON logs(block_number) WHERE finalized = true;

-- Function to extract method signature from transaction input
CREATE OR REPLACE FUNCTION get_method_signature(input text)
RETURNS text AS $$
BEGIN
  IF input IS NULL OR length(input) < 10 THEN
    RETURN NULL;
  END IF;
  RETURN substring(input, 3, 8);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_blocks_updated_at
    BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at
    BEFORE UPDATE ON logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to mark records as finalized
CREATE OR REPLACE FUNCTION mark_finalized(head_block bigint)
RETURNS void AS $$
BEGIN
  -- Mark blocks as finalized (15 blocks behind head)
  UPDATE blocks
  SET finalized = true
  WHERE number <= head_block - 15 AND finalized = false;

  -- Mark transactions as finalized
  UPDATE transactions
  SET finalized = true
  WHERE block_number <= head_block - 15 AND finalized = false;

  -- Mark logs as finalized
  UPDATE logs
  SET finalized = true
  WHERE block_number <= head_block - 15 AND finalized = false;
END;
$$ LANGUAGE plpgsql;

-- Initialize cursor
INSERT INTO index_cursor (id, last_block) VALUES ('main', 0) ON CONFLICT (id) DO NOTHING;

-- Materialized Views for Analytics

-- Daily transaction summary
CREATE MATERIALIZED VIEW mv_daily_tx AS
SELECT
  DATE_TRUNC('day', b.timestamp) as date,
  COUNT(*) as total_txs,
  COUNT(*) FILTER (WHERE t.status = 1) as successful_txs,
  COUNT(*) FILTER (WHERE t.status = 0) as failed_txs,
  COUNT(*) FILTER (WHERE t.to IS NULL) as contract_creations,
  COUNT(DISTINCT t."from") as unique_senders,
  COUNT(DISTINCT t."to") as unique_receivers,
  SUM(t.value) as total_value,
  AVG(t.gas_used) as avg_gas_used,
  SUM(t.gas_used * t.effective_gas_price) as total_gas_fees,
  COUNT(DISTINCT l.address) as active_contracts,
  COUNT(*) FILTER (WHERE t.method IS NOT NULL) as contract_interactions
FROM transactions t
JOIN blocks b ON t.block_number = b.number
LEFT JOIN logs l ON t.hash = l.transaction_hash
WHERE t.finalized = true
GROUP BY DATE_TRUNC('day', b.timestamp)
ORDER BY date DESC;

-- Overall analytics summary
CREATE MATERIALIZED VIEW mv_summary AS
SELECT
  COUNT(DISTINCT t.hash) as total_transactions,
  COUNT(DISTINCT b.number) as total_blocks,
  COUNT(DISTINCT t."from") as unique_addresses,
  COUNT(DISTINCT l.address) as unique_contracts,
  COUNT(*) FILTER (WHERE t.status = 1) as successful_transactions,
  COUNT(*) FILTER (WHERE t.to IS NULL) as contract_deployments,
  SUM(t.value) as total_value_transferred,
  SUM(t.gas_used * t.effective_gas_price) as total_gas_fees,
  AVG(t.gas_used) as avg_gas_per_tx,
  MAX(b.number) as latest_block,
  COUNT(*) FILTER (WHERE b.timestamp >= NOW() - INTERVAL '24 hours') as txs_24h,
  COUNT(*) FILTER (WHERE b.timestamp >= NOW() - INTERVAL '7 days') as txs_7d,
  COUNT(DISTINCT t."from") FILTER (WHERE b.timestamp >= NOW() - INTERVAL '24 hours') as active_addresses_24h
FROM transactions t
JOIN blocks b ON t.block_number = b.number
LEFT JOIN logs l ON t.hash = l.transaction_hash
WHERE t.finalized = true;

-- Indexes for materialized views
CREATE INDEX idx_mv_daily_tx_date ON mv_daily_tx(date);
CREATE UNIQUE INDEX idx_mv_summary_singleton ON mv_summary((1));

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_tx;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_summary;
END;
$$ LANGUAGE plpgsql;
