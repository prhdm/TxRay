import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create as createJWT } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";

// Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// JWT key for token validation
let _jwtKeyPromise = null;
function getJwtKey() {
  const secret = JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  if (!_jwtKeyPromise) {
    _jwtKeyPromise = crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {
      name: "HMAC",
      hash: "SHA-256"
    }, false, [
      "sign",
      "verify"
    ]);
  }
  return _jwtKeyPromise;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Authentication validation
async function validateAuth(req: Request): Promise<{ user: any } | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const jwtKey = await getJwtKey()

    // Verify the JWT token
    const payload = await createJWT({ alg: "HS256", typ: "JWT" }, {}, jwtKey).verify(token)

    return { user: payload }
  } catch (error) {
    console.error('Auth validation error:', error)
    return null
  }
}

// Cache headers for analytics endpoints
const cacheHeaders = {
  'Cache-Control': 'max-age=60, stale-while-revalidate=300',
  ...corsHeaders,
}

// Route handlers
async function handleIngestTx(req: Request): Promise<Response> {
  try {
    const { hash, from, method, pending = true, source = 'dapp' } = await req.json()

    if (!hash || !from) {
      return new Response(JSON.stringify({ error: 'Missing required fields: hash, from' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get latest block for block_number
    const { data: latestBlock } = await supabase
      .from('blocks')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .single()

    const blockNumber = latestBlock?.number || 0

    // Upsert transaction
    const { error } = await supabase
      .from('transactions')
      .upsert({
        hash,
        block_number: blockNumber,
        block_hash: '', // Will be updated when confirmed
        from,
        method,
        pending,
        source,
      }, { onConflict: 'hash' })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Ingest TX error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleAnalyticsSummary(): Promise<Response> {
  try {
    const { data: summary, error } = await supabase
      .from('mv_summary')
      .select('*')
      .single()

    if (error) throw error

    return new Response(JSON.stringify(summary), {
      headers: { ...cacheHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleAnalyticsDaily(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    let query = supabase
      .from('mv_daily_tx')
      .select('*')
      .order('date', { ascending: false })

    if (from) {
      query = query.gte('date', from)
    }

    if (to) {
      query = query.lte('date', to)
    }

    const { data: dailyStats, error } = await query.limit(365) // Max 1 year

    if (error) throw error

    return new Response(JSON.stringify(dailyStats), {
      headers: { ...cacheHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Analytics daily error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleAnalyticsTxs(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

    let query = supabase
      .from('transactions')
      .select(`
        hash,
        block_number,
        from,
        to,
        value,
        gas_used,
        gas_price,
        status,
        method,
        timestamp:blocks!inner(timestamp)
      `)
      .eq('finalized', true)
      .order('block_number', { ascending: false })
      .order('transaction_index', { ascending: false })

    // Keyset pagination using (block_number, hash)
    if (cursor) {
      const [blockNum, txHash] = cursor.split(':')
      query = query.or(`block_number.lt.${blockNum},and(block_number.eq.${blockNum},hash.lt.${txHash})`)
    }

    const { data: transactions, error } = await query.limit(limit)

    if (error) throw error

    // Get next cursor
    const lastTx = transactions[transactions.length - 1]
    const nextCursor = lastTx ? `${lastTx.block_number}:${lastTx.hash}` : null

    return new Response(JSON.stringify({
      transactions,
      next_cursor: nextCursor,
      has_more: transactions.length === limit
    }), {
      headers: { ...cacheHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Analytics TXs error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleSearchWallets(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')

    if (!query || query.length < 3) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Search for wallet addresses that contain the query
    const { data: wallets, error } = await supabase
      .from('transactions')
      .select('from, to')
      .or(`from.ilike.%${query}%,to.ilike.%${query}%`)
      .limit(20)

    if (error) throw error

    // Extract unique wallet addresses
    const uniqueWallets = new Set<string>()

    wallets.forEach(tx => {
      if (tx.from) uniqueWallets.add(tx.from.toLowerCase())
      if (tx.to) uniqueWallets.add(tx.to.toLowerCase())
    })

    // Filter by the search query and limit results
    const filteredWallets = Array.from(uniqueWallets)
      .filter(wallet => wallet.includes(query.toLowerCase()))
      .slice(0, 10)

    return new Response(JSON.stringify(filteredWallets), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Search wallets error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/analytics', '')

  // Route to appropriate handler
  switch (`${req.method} ${path}`) {
    case 'POST /ingest/tx':
      return await handleIngestTx(req)
    case 'GET /summary':
      return await handleAnalyticsSummary()
    case 'GET /daily':
      return await handleAnalyticsDaily(req)
    case 'GET /txs':
      return await handleAnalyticsTxs(req)
    case 'GET /search-wallets':
      return await handleSearchWallets(req)
    default:
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }
})


