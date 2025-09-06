#!/bin/bash

# Deploy Analytics Pipeline Script
echo "🚀 Deploying Blockchain Analytics Pipeline..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null && ! pnpm exec supabase --version &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   pnpm add -D supabase -w"
    exit 1
fi

# Check if user is logged in
if ! pnpm exec supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "   pnpm exec supabase login"
    exit 1
fi

# Deploy the analytics functions
echo "📦 Deploying analytics Edge Functions..."
pnpm exec supabase functions deploy analytics
pnpm exec supabase functions deploy indexer-run

if [ $? -eq 0 ]; then
    echo "✅ Analytics pipeline deployed successfully!"
    echo ""
    echo "🔧 Required Environment Variables (set in Supabase Dashboard → Edge Functions):"
    echo "   - SUPABASE_URL: Your Supabase project URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: Your service role key (from Project Settings → API)"
    echo "   - HEKLA_RPC: Taiko Hekla RPC endpoint (e.g., https://rpc.hekla.taiko.xyz)"
    echo "   - CONTRACTS: JSON array of contract addresses to monitor"
    echo "   - EVENT_SIGS: JSON array of event signatures to monitor"
    echo ""
    echo "📊 Available Endpoints:"
    echo "   POST /functions/v1/analytics/ingest/tx - Ingest transaction"
    echo "   GET  /functions/v1/analytics/summary - Analytics summary"
    echo "   GET  /functions/v1/analytics/daily?from=2024-01-01&to=2024-01-31 - Daily stats"
    echo "   GET  /functions/v1/analytics/txs?cursor=12345:0x...&limit=50 - Transaction list"
    echo ""
    echo "⏰ Scheduler Setup:"
    echo "   Go to Supabase Dashboard → Edge Functions → Cron"
    echo "   Add schedule: */2 * * * * (every 2 minutes)"
    echo "   Function: indexer-run"
    echo "   Method: POST"
    echo ""
    echo "🗄️ Database Setup:"
    echo "   Run the migration: supabase-migrations/004_blockchain_analytics.sql"
    echo ""
    echo "📈 Analytics Features:"
    echo "   - Real-time blockchain indexing"
    echo "   - Materialized views for fast queries"
    echo "   - Rate limiting and error handling"
    echo "   - Free-tier optimized (2000 block chunks)"
    echo "   - 20-block overlap for data integrity"
    echo "   - 15-block finality confirmation"
else
    echo "❌ Failed to deploy analytics pipeline"
    exit 1
fi


