# Supabase Blockchain Analytics Pipeline

A comprehensive, free-tier friendly blockchain analytics pipeline for Taiko Hekla using Supabase Edge Functions.

## 🚀 Features

- **Real-time Indexing**: Automatic blockchain data ingestion every 2 minutes
- **Taiko Hekla Native**: Optimized for chainId 167009
- **Free-tier Friendly**: 2000-block chunks, rate limiting, batch operations
- **Materialized Views**: Fast analytics with `mv_daily_tx` and `mv_summary`
- **HTTP API**: RESTful endpoints with proper caching
- **Error Handling**: Retry logic, backoff, idempotent operations
- **Data Integrity**: 20-block overlap, 15-block finality confirmation

## 📊 Database Schema

### Core Tables

```sql
-- Blocks with timestamps and gas metrics
CREATE TABLE blocks (
  number bigint PRIMARY KEY,
  hash text NOT NULL UNIQUE,
  timestamp timestamptz NOT NULL,
  gas_used bigint NOT NULL,
  miner text NOT NULL,
  finalized boolean DEFAULT false
);

-- Transactions with method detection
CREATE TABLE transactions (
  hash text PRIMARY KEY,
  block_number bigint REFERENCES blocks(number),
  "from" text NOT NULL,
  "to" text,
  value numeric(78,0) DEFAULT 0,
  gas_used bigint,
  status integer,
  method text, -- Extracted from input
  finalized boolean DEFAULT false
);

-- Event logs with topic indexing
CREATE TABLE logs (
  id text PRIMARY KEY, -- tx_hash + log_index
  transaction_hash text REFERENCES transactions(hash),
  block_number bigint REFERENCES blocks(number),
  address text NOT NULL, -- Contract address
  topics text[] NOT NULL, -- Event signature + params
  finalized boolean DEFAULT false
);

-- Sync progress tracking
CREATE TABLE index_cursor (
  id text PRIMARY KEY DEFAULT 'main',
  last_block bigint NOT NULL DEFAULT 0,
  status text DEFAULT 'active',
  last_updated timestamptz DEFAULT now()
);
```

### Materialized Views

```sql
-- Daily transaction analytics
CREATE MATERIALIZED VIEW mv_daily_tx AS
SELECT
  DATE_TRUNC('day', b.timestamp) as date,
  COUNT(*) as total_txs,
  COUNT(*) FILTER (WHERE t.status = 1) as successful_txs,
  SUM(t.value) as total_value,
  AVG(t.gas_used) as avg_gas_used,
  COUNT(DISTINCT l.address) as active_contracts
FROM transactions t
JOIN blocks b ON t.block_number = b.number
LEFT JOIN logs l ON t.hash = l.transaction_hash
WHERE t.finalized = true
GROUP BY DATE_TRUNC('day', b.timestamp);

-- Overall summary statistics
CREATE MATERIALIZED VIEW mv_summary AS
SELECT
  COUNT(DISTINCT t.hash) as total_transactions,
  COUNT(DISTINCT b.number) as total_blocks,
  SUM(t.value) as total_value_transferred,
  COUNT(*) FILTER (WHERE b.timestamp >= NOW() - INTERVAL '24 hours') as txs_24h
FROM transactions t
JOIN blocks b ON t.block_number = b.number
WHERE t.finalized = true;
```

## 🔧 API Endpoints

### Indexer Control
```typescript
POST /functions/v1/analytics/indexer-run
// Triggers manual indexer run
```

### Data Ingestion
```typescript
POST /functions/v1/analytics/ingest/tx
// Body: { hash, from, method, pending, source }
```

### Analytics Queries
```typescript
GET /functions/v1/analytics/summary
// Returns overall statistics with 60s cache

GET /functions/v1/analytics/daily?from=2024-01-01&to=2024-01-31
// Returns daily statistics for date range with 60s cache

GET /functions/v1/analytics/txs?cursor=12345:0x...&limit=50
// Returns paginated transactions with keyset pagination
```

## ⚙️ Configuration

### Environment Variables
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
HEKLA_RPC=https://rpc.hekla.taiko.xyz
CONTRACTS=["0x0D99E3e638844020056C7659Dbe657C4C67276af"]  # Your contracts
EVENT_SIGS=["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]  # Transfer events
```

### Free-tier Optimizations
- **Chunk Size**: 2000 blocks per run
- **Overlap**: 20 blocks for safety
- **Batch Size**: 500 records per upsert
- **Rate Limiting**: Exponential backoff on 429/5xx
- **Caching**: 60s cache on analytics endpoints

## 🚀 Deployment

### 1. Database Setup
```bash
# Run the migration
psql -h your-db-host -U postgres -d postgres < supabase-migrations/004_blockchain_analytics.sql
```

### 2. Deploy Functions
```bash
./scripts/deploy-analytics.sh
```

### 3. Configure Scheduler
```
Supabase Dashboard → Edge Functions → Cron
- Function: indexer-run
- Schedule: */2 * * * * (every 2 minutes)
- Method: POST
```

### 4. Set Environment Variables
```
Supabase Dashboard → Edge Functions → Environment Variables
- HEKLA_RPC
- CONTRACTS
- EVENT_SIGS
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
```

## 🔄 Indexer Workflow

1. **Read Cursor**: Get `index_cursor.last_block`
2. **Calculate Range**: `from = max(0, last - 20)` to `head`
3. **Chunk Processing**: Process 2000 blocks max per run
4. **Fetch Logs**: `eth_getLogs` for CONTRACTS + EVENT_SIGS
5. **Fetch Blocks**: Get block data for transactions
6. **Fetch Receipts**: Get transaction receipts once per tx
7. **Upsert Data**: Idempotent batch inserts (500 records)
8. **Mark Finalized**: `block <= head - 15`
9. **Update Cursor**: Set new `last_block`
10. **Refresh Analytics**: Update materialized views

## 📈 Analytics Examples

### Daily Transaction Volume
```sql
SELECT date, total_txs, total_value
FROM mv_daily_tx
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Top Contracts by Activity
```sql
SELECT l.address, COUNT(*) as tx_count
FROM logs l
JOIN transactions t ON l.transaction_hash = t.hash
WHERE t.finalized = true
  AND l.block_number > (SELECT MAX(number) - 10000 FROM blocks) -- Last 10k blocks
GROUP BY l.address
ORDER BY tx_count DESC
LIMIT 10;
```

### Gas Usage Trends
```sql
SELECT
  DATE_TRUNC('hour', b.timestamp) as hour,
  AVG(t.gas_used) as avg_gas_used,
  SUM(t.gas_used * t.effective_gas_price) as total_gas_fees
FROM transactions t
JOIN blocks b ON t.block_number = b.number
WHERE t.finalized = true
  AND b.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', b.timestamp)
ORDER BY hour;
```

## 🛡️ Security & Reliability

- **Idempotent Operations**: Safe to retry failed runs
- **Data Validation**: Strict type checking and sanitization
- **Error Recovery**: Automatic retry with exponential backoff
- **Rate Limiting**: Respects RPC provider limits
- **Data Integrity**: Overlap processing prevents gaps
- **Finality Confirmation**: 15-block delay for data stability

## 📊 Monitoring

### Check Indexer Status
```sql
SELECT * FROM index_cursor WHERE id = 'main';
```

### Recent Processing Stats
```sql
SELECT
  COUNT(*) as blocks_processed,
  MAX(number) as latest_block,
  COUNT(*) FILTER (WHERE finalized = true) as finalized_blocks
FROM blocks
WHERE created_at >= NOW() - INTERVAL '1 hour';
```

### Error Monitoring
```sql
SELECT * FROM index_cursor
WHERE status = 'error'
ORDER BY last_updated DESC
LIMIT 5;
```

## 🔧 Customization

### Add New Contracts
```bash
# Update CONTRACTS environment variable
CONTRACTS='["0x...", "0x..."]'
```

### Add New Event Signatures
```bash
# Update EVENT_SIGS environment variable
EVENT_SIGS='["0xddf252ad...", "0x..."]'
```

### Modify Chunk Size
```typescript
// In indexer-run.ts
const CHUNK_SIZE = 1000 // Reduce for slower networks
```

### Add Custom Analytics
```sql
-- Create new materialized view
CREATE MATERIALIZED VIEW mv_custom_analytics AS
SELECT
  -- Your custom logic here
FROM transactions t
JOIN blocks b ON t.block_number = b.number
WHERE t.finalized = true;
```

This analytics pipeline provides comprehensive blockchain insights while being optimized for Supabase's free tier limitations! 🎯📊


