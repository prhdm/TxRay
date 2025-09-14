BEGIN;

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS index_cursor (
                                            id smallint PRIMARY KEY DEFAULT 1,
                                            last_block_number bigint NOT NULL DEFAULT 0,
                                            last_run_at timestamptz NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS transactions (
                                            tx_hash text PRIMARY KEY,
                                            block_number bigint NOT NULL,
                                            block_timestamp timestamptz NOT NULL,
                                            from_address text NOT NULL,
                                            to_address text NOT NULL,
                                            value_wei numeric(78,0) NOT NULL DEFAULT 0,
    gas_used numeric(78,0) NOT NULL DEFAULT 0,
    effective_gas_price_wei numeric(78,0) NOT NULL DEFAULT 0,
    gas_cost_wei numeric(78,0) GENERATED ALWAYS AS
(gas_used * effective_gas_price_wei) STORED,
    status boolean NOT NULL,
    method text NULL
    );

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions (block_number);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions (block_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions (from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions (to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_method ON transactions (method);

-- ---------- Views ----------
CREATE OR REPLACE VIEW kpi_summary AS
SELECT
    count(*)::bigint AS total_transactions,
    coalesce(sum(gas_cost_wei),0) AS total_gas_cost_wei,
    (coalesce(sum(gas_cost_wei),0) / 1e18)::numeric AS total_gas_cost_eth,
    min(block_timestamp) AS first_tx_at,
    max(block_timestamp) AS last_tx_at,
    (SELECT last_block_number FROM index_cursor WHERE id = 1) AS latest_block,
    (SELECT COUNT(*) FROM transactions WHERE block_timestamp >= NOW() - INTERVAL '24 hours') AS txs_24h,
    (SELECT COUNT(*) FROM transactions WHERE block_timestamp >= NOW() - INTERVAL '7 days') AS txs_7d,
    CASE
    WHEN count(*) > 0 THEN (coalesce(sum(gas_used),0) / count(*))::bigint
    ELSE 0
END AS avg_gas_per_tx
FROM transactions;

-- ---------- Functions (numeric outputs; compatible with existing signature) ----------
-- Drop existing function if it exists to avoid return type conflicts
DROP FUNCTION IF EXISTS kpi_timeseries(text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION kpi_timeseries(
  granularity text DEFAULT 'day',
  start_at timestamptz DEFAULT NULL,
  end_at timestamptz DEFAULT NULL
)
RETURNS TABLE(
  period text, 
  transaction_count bigint, 
  gas_used numeric, 
  gas_cost numeric
)
LANGUAGE sql STABLE AS
$$
WITH bounds AS (
  SELECT
    coalesce(start_at, (SELECT min(block_timestamp) FROM transactions)) AS s,
    coalesce(end_at, now()) AS e
),
step AS (
  SELECT CASE granularity
    WHEN 'minute' THEN interval '1 minute'
    WHEN 'hour'   THEN interval '1 hour'
    WHEN 'day'    THEN interval '1 day'
    WHEN 'week'   THEN interval '1 week'
    ELSE interval '1 day'
  END AS iv
  FROM bounds LIMIT 1
),
series AS (
  SELECT generate_series(b.s, b.e, st.iv) AS bucket_start
  FROM bounds b CROSS JOIN step st
),
agg AS (
  SELECT 
    CASE granularity
      WHEN 'minute' THEN to_char(block_timestamp, 'YYYY-MM-DD HH24:MI:00')
      WHEN 'hour'   THEN to_char(block_timestamp, 'YYYY-MM-DD HH24:00:00')
      WHEN 'day'    THEN to_char(block_timestamp, 'YYYY-MM-DD')
      WHEN 'week'   THEN to_char(block_timestamp, 'YYYY-"W"WW')
      ELSE to_char(block_timestamp, 'YYYY-MM-DD')
    END AS period,
    count(*)::bigint AS tx_count,
    coalesce(sum(gas_used),0) AS gas_used_sum,
    coalesce(sum(gas_cost_wei),0) AS gas_cost_sum
  FROM transactions
  WHERE 
    (start_at IS NULL OR block_timestamp >= start_at)
    AND (end_at IS NULL OR block_timestamp <= end_at)
  GROUP BY 1
)
SELECT
    s.period,
    coalesce(a.tx_count,0) AS transaction_count,
    coalesce(a.gas_used_sum,0) AS gas_used,
    coalesce(a.gas_cost_sum,0) AS gas_cost
FROM (
         SELECT
             CASE granularity
                 WHEN 'minute' THEN to_char(bucket_start, 'YYYY-MM-DD HH24:MI:00')
                 WHEN 'hour'   THEN to_char(bucket_start, 'YYYY-MM-DD HH24:00:00')
                 WHEN 'day'    THEN to_char(bucket_start, 'YYYY-MM-DD')
                 WHEN 'week'   THEN to_char(bucket_start, 'YYYY-"W"WW')
                 ELSE to_char(bucket_start, 'YYYY-MM-DD')
                 END AS period
         FROM series
     ) s
         LEFT JOIN agg a ON s.period = a.period
ORDER BY s.period;
$$;

-- Drop existing wallet function if it exists
DROP FUNCTION IF EXISTS kpi_summary_wallet(text);

CREATE OR REPLACE FUNCTION kpi_summary_wallet(wallet_addr text)
RETURNS TABLE(
  total_transactions bigint,
  total_gas_cost_wei numeric,
  total_gas_cost_eth numeric,
  first_tx_at timestamptz,
  last_tx_at timestamptz,
  latest_block bigint,
  txs_24h bigint,
  txs_7d bigint,
  avg_gas_per_tx bigint
)
LANGUAGE sql STABLE AS
$$
SELECT
    count(*)::bigint AS total_transactions,
    coalesce(sum(gas_cost_wei),0) AS total_gas_cost_wei,
    (coalesce(sum(gas_cost_wei),0) / 1e18)::numeric AS total_gas_cost_eth,
    min(block_timestamp) AS first_tx_at,
    max(block_timestamp) AS last_tx_at,
    (SELECT last_block_number FROM index_cursor WHERE id = 1) AS latest_block,
    (SELECT COUNT(*) FROM transactions
     WHERE from_address = wallet_addr
       AND block_timestamp >= NOW() - INTERVAL '24 hours') AS txs_24h,
    (SELECT COUNT(*) FROM transactions
WHERE from_address = wallet_addr
  AND block_timestamp >= NOW() - INTERVAL '7 days') AS txs_7d,
    CASE
    WHEN count(*) > 0 THEN (coalesce(sum(gas_used),0) / count(*))::bigint
    ELSE 0
END AS avg_gas_per_tx
FROM transactions
WHERE from_address = wallet_addr;
$$;

-- Drop existing wallet timeseries function if it exists
DROP FUNCTION IF EXISTS kpi_timeseries_wallet(text, timestamptz, timestamptz, text);

CREATE OR REPLACE FUNCTION kpi_timeseries_wallet(
  granularity text DEFAULT 'day',
  start_at timestamptz DEFAULT NULL,
  end_at timestamptz DEFAULT NULL,
  wallet_addr text DEFAULT NULL
)
RETURNS TABLE(
  period text, 
  transaction_count bigint, 
  gas_used numeric, 
  gas_cost numeric
)
LANGUAGE sql STABLE AS
$$
WITH bounds AS (
  SELECT
    coalesce(start_at, (SELECT min(block_timestamp) FROM transactions WHERE from_address = wallet_addr)) AS s,
    coalesce(end_at, now()) AS e
),
step AS (
  SELECT CASE granularity
    WHEN 'minute' THEN interval '1 minute'
    WHEN 'hour'   THEN interval '1 hour'
    WHEN 'day'    THEN interval '1 day'
    WHEN 'week'   THEN interval '1 week'
    ELSE interval '1 day'
  END AS iv
  FROM bounds LIMIT 1
),
series AS (
  SELECT generate_series(b.s, b.e, st.iv) AS bucket_start
  FROM bounds b CROSS JOIN step st
),
agg AS (
  SELECT 
    CASE granularity
      WHEN 'minute' THEN to_char(block_timestamp, 'YYYY-MM-DD HH24:MI:00')
      WHEN 'hour'   THEN to_char(block_timestamp, 'YYYY-MM-DD HH24:00:00')
      WHEN 'day'    THEN to_char(block_timestamp, 'YYYY-MM-DD')
      WHEN 'week'   THEN to_char(block_timestamp, 'YYYY-"W"WW')
      ELSE to_char(block_timestamp, 'YYYY-MM-DD')
    END AS period,
    count(*)::bigint AS tx_count,
    coalesce(sum(gas_used),0) AS gas_used_sum,
    coalesce(sum(gas_cost_wei),0) AS gas_cost_sum
  FROM transactions
  WHERE 
    from_address = wallet_addr
    AND (start_at IS NULL OR block_timestamp >= start_at)
    AND (end_at IS NULL OR block_timestamp <= end_at)
  GROUP BY 1
)
SELECT
    s.period,
    coalesce(a.tx_count,0) AS transaction_count,
    coalesce(a.gas_used_sum,0) AS gas_used,
    coalesce(a.gas_cost_sum,0) AS gas_cost
FROM (
         SELECT
             CASE granularity
                 WHEN 'minute' THEN to_char(bucket_start, 'YYYY-MM-DD HH24:MI:00')
                 WHEN 'hour'   THEN to_char(bucket_start, 'YYYY-MM-DD HH24:00:00')
                 WHEN 'day'    THEN to_char(bucket_start, 'YYYY-MM-DD')
                 WHEN 'week'   THEN to_char(bucket_start, 'YYYY-"W"WW')
                 ELSE to_char(bucket_start, 'YYYY-MM-DD')
                 END AS period
         FROM series
     ) s
         LEFT JOIN agg a ON s.period = a.period
ORDER BY s.period;
$$;

-- ---------- Text-based functions for frontend compatibility ----------
-- Drop existing text functions if they exist
DROP FUNCTION IF EXISTS kpi_timeseries_text(text, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS kpi_timeseries_wallet_text(text, timestamptz, timestamptz, text);

CREATE OR REPLACE FUNCTION kpi_timeseries_text(
  granularity text DEFAULT 'day',
  start_at timestamptz DEFAULT NULL,
  end_at timestamptz DEFAULT NULL
) RETURNS TABLE(period text, transaction_count bigint, gas_used text, gas_cost text)
LANGUAGE sql STABLE AS
$$ SELECT period, transaction_count, gas_used::text, gas_cost::text
   FROM kpi_timeseries(granularity, start_at, end_at); $$;

CREATE OR REPLACE FUNCTION kpi_timeseries_wallet_text(
  granularity text DEFAULT 'day',
  start_at timestamptz DEFAULT NULL,
  end_at timestamptz DEFAULT NULL,
  wallet_addr text DEFAULT NULL
) RETURNS TABLE(period text, transaction_count bigint, gas_used text, gas_cost text)
LANGUAGE sql STABLE AS
$$ SELECT period, transaction_count, gas_used::text, gas_cost::text
   FROM kpi_timeseries_wallet(granularity, start_at, end_at, wallet_addr); $$;

-- ---------- More views ----------
CREATE OR REPLACE VIEW method_distribution AS
SELECT
    method,
    count(*) as transaction_count,
    count(*) * 100.0 / sum(count(*)) OVER() as percentage,
    sum(gas_cost_wei) as total_gas_cost,
    avg(gas_used) as avg_gas_used
FROM transactions
WHERE method IS NOT NULL
GROUP BY method
ORDER BY transaction_count DESC;

CREATE OR REPLACE VIEW daily_activity AS
SELECT
    date_trunc('day', block_timestamp) as date,
  count(*) as transaction_count,
  count(DISTINCT from_address) as unique_wallets,
  sum(gas_cost_wei) as total_gas_cost,
  avg(gas_used) as avg_gas_used
FROM transactions
GROUP BY date_trunc('day', block_timestamp)
ORDER BY date DESC;

CREATE OR REPLACE VIEW wallet_activity_ranking AS
SELECT
    from_address,
    count(*) as transaction_count,
    sum(gas_cost_wei) as total_gas_spent,
    min(block_timestamp) as first_transaction,
    max(block_timestamp) as last_transaction,
    count(DISTINCT method) as unique_methods_used
FROM transactions
GROUP BY from_address
ORDER BY transaction_count DESC;

-- ---------- Helper functions ----------
CREATE OR REPLACE FUNCTION get_unique_wallets()
RETURNS bigint
LANGUAGE sql STABLE AS
$$
SELECT count(DISTINCT from_address) FROM transactions;
$$;

CREATE OR REPLACE FUNCTION get_method_stats()
RETURNS TABLE(
  method text,
  count bigint,
  percentage numeric,
  total_gas_cost numeric
)
LANGUAGE sql STABLE AS
$$
SELECT
    method,
    count(*) as count,
  round(count(*) * 100.0 / sum(count(*)) OVER(), 2) as percentage,
  sum(gas_cost_wei) as total_gas_cost
FROM transactions
WHERE method IS NOT NULL
GROUP BY method
ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION get_top_wallets(limit_count int DEFAULT 10)
RETURNS TABLE(
  wallet_address text,
  transaction_count bigint,
  total_gas_spent numeric,
  last_activity timestamptz
)
LANGUAGE sql STABLE AS
$$
SELECT
    from_address as wallet_address,
    count(*) as transaction_count,
    sum(gas_cost_wei) as total_gas_spent,
    max(block_timestamp) as last_activity
FROM transactions
GROUP BY from_address
ORDER BY transaction_count DESC
    LIMIT limit_count;
$$;

-- ---------- Seed cursor ----------
INSERT INTO index_cursor (id, last_block_number, last_run_at)
VALUES (1, 3443580, NOW())
    ON CONFLICT (id) DO UPDATE
                            SET last_block_number = excluded.last_block_number,
                            last_run_at = excluded.last_run_at;

-- ---------- Grants (use explicit signatures for reliability) ----------
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON index_cursor TO authenticated;
GRANT SELECT ON kpi_summary TO authenticated;
GRANT SELECT ON method_distribution TO authenticated;
GRANT SELECT ON daily_activity TO authenticated;
GRANT SELECT ON wallet_activity_ranking TO authenticated;

GRANT EXECUTE ON FUNCTION kpi_timeseries(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION kpi_timeseries_text(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION kpi_summary_wallet(text) TO authenticated;
GRANT EXECUTE ON FUNCTION kpi_timeseries_wallet(text, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION kpi_timeseries_wallet_text(text, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unique_wallets() TO authenticated;
GRANT EXECUTE ON FUNCTION get_method_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_wallets(int) TO authenticated;

COMMIT;

