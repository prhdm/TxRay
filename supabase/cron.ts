// Supabase Cron Configuration
// This file configures scheduled Edge Function runs

export const cronJobs = [
  {
    name: 'blockchain-indexer',
    expression: '*/2 * * * *', // Every 2 minutes
    functionName: 'indexer-run',
    payload: {},
  },
]

// Note: This is a configuration file for Supabase Cron
// In Supabase Dashboard → Edge Functions → Cron, you would set:
// - Function: indexer-run
// - Schedule: */2 * * * * (every 2 minutes)
// - HTTP Method: POST


