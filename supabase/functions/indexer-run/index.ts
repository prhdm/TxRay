// Supabase Edge Function for running the blockchain indexer
// This function is called by Supabase Scheduler every 2 minutes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Call the analytics indexer-run function
    const response = await fetch(
      `${new URL(req.url).origin}/functions/v1/analytics/indexer-run`,
      {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization') || '',
        },
      }
    )

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Indexer scheduler error:', error)
    return new Response(JSON.stringify({
      error: 'Scheduler error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})


