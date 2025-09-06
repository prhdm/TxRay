import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const HEKLA_RPC = Deno.env.get('HEKLA_RPC')!
const CONTRACTS = JSON.parse(Deno.env.get('CONTRACTS') || '[]')
const EVENT_SIGS = JSON.parse(Deno.env.get('EVENT_SIGS') || '[]')

// Constants
const CHUNK_SIZE = 2000 // Free-tier friendly chunk size
const OVERLAP_BLOCKS = 20 // 20-block overlap for safety
const FINALITY_BLOCKS = 15 // Mark finalized when block <= head - 15
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Utility functions
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rpcRequest(method: string, params: any[] = []): Promise<any> {
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(HEKLA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        // Handle rate limiting
        if (data.error.code === 429 || data.error.code >= 500) {
          retries++
          await sleep(RETRY_DELAY * Math.pow(2, retries))
          continue
        }
        throw new Error(data.error.message)
      }

      return data.result
    } catch (error) {
      retries++
      if (retries >= MAX_RETRIES) {
        throw error
      }
      await sleep(RETRY_DELAY * Math.pow(2, retries))
    }
  }
}

async function getLatestBlockNumber(): Promise<bigint> {
  const result = await rpcRequest('eth_blockNumber')
  return BigInt(result)
}

async function getBlockByNumber(blockNumber: bigint, includeTxs = false): Promise<any> {
  const hexBlock = `0x${blockNumber.toString(16)}`
  return await rpcRequest('eth_getBlockByNumber', [hexBlock, includeTxs])
}

async function getTransactionReceipt(txHash: string): Promise<any> {
  return await rpcRequest('eth_getTransactionReceipt', [txHash])
}

async function getLogs(fromBlock: bigint, toBlock: bigint): Promise<any[]> {
  const filter = {
    fromBlock: `0x${fromBlock.toString(16)}`,
    toBlock: `0x${toBlock.toString(16)}`,
    address: CONTRACTS.length > 0 ? CONTRACTS : undefined,
    topics: EVENT_SIGS.length > 0 ? [EVENT_SIGS] : undefined
  }

  return await rpcRequest('eth_getLogs', [filter])
}

async function getMethodSignature(input: string): Promise<string | null> {
  if (!input || input.length < 10) return null
  return input.slice(2, 10)
}

// Database operations
async function updateCursor(lastBlock: bigint, status = 'active', errorMessage = null): Promise<void> {
  const { error } = await supabase
    .from('index_cursor')
    .update({
      last_block: lastBlock.toString(),
      last_updated: new Date().toISOString(),
      status,
      error_message: errorMessage,
      retry_count: errorMessage ? 0 : undefined
    })
    .eq('id', 'main')

  if (error) throw error
}

async function upsertBlocks(blocks: any[]): Promise<void> {
  if (blocks.length === 0) return

  const blockData = blocks.map(block => ({
    number: parseInt(block.number, 16),
    hash: block.hash,
    parent_hash: block.parentHash,
    timestamp: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(),
    gas_limit: parseInt(block.gasLimit, 16),
    gas_used: parseInt(block.gasUsed, 16),
    miner: block.miner,
    difficulty: block.difficulty,
    total_difficulty: block.totalDifficulty,
    size: block.size ? parseInt(block.size, 16) : null,
    base_fee_per_gas: block.baseFeePerGas ? parseInt(block.baseFeePerGas, 16) : null
  }))

  const { error } = await supabase
    .from('blocks')
    .upsert(blockData, { onConflict: 'number' })

  if (error) throw error
}

async function upsertTransactions(transactions: any[], receipts: any[]): Promise<void> {
  if (transactions.length === 0) return

  const receiptMap = new Map(receipts.map(r => [r.transactionHash, r]))

  const txData = transactions.map(tx => {
    const receipt = receiptMap.get(tx.hash)
    const method = getMethodSignature(tx.input)

    return {
      hash: tx.hash,
      block_number: parseInt(tx.blockNumber, 16),
      block_hash: tx.blockHash,
      from: tx.from,
      to: tx.to,
      value: tx.value ? BigInt(tx.value).toString() : '0',
      gas_price: tx.gasPrice ? parseInt(tx.gasPrice, 16) : null,
      gas_limit: tx.gas ? parseInt(tx.gas, 16) : null,
      gas_used: receipt ? parseInt(receipt.gasUsed, 16) : null,
      max_fee_per_gas: tx.maxFeePerGas ? parseInt(tx.maxFeePerGas, 16) : null,
      max_priority_fee_per_gas: tx.maxPriorityFeePerGas ? parseInt(tx.maxPriorityFeePerGas, 16) : null,
      input: tx.input,
      nonce: tx.nonce ? parseInt(tx.nonce, 16) : null,
      transaction_index: tx.transactionIndex ? parseInt(tx.transactionIndex, 16) : 0,
      status: receipt ? parseInt(receipt.status, 16) : null,
      contract_address: receipt?.contractAddress,
      cumulative_gas_used: receipt ? parseInt(receipt.cumulativeGasUsed, 16) : null,
      effective_gas_price: receipt ? parseInt(receipt.effectiveGasPrice, 16) : null,
      type: tx.type ? parseInt(tx.type, 16) : 0,
      method: method
    }
  })

  // Batch upsert in chunks of 500
  for (let i = 0; i < txData.length; i += 500) {
    const chunk = txData.slice(i, i + 500)
    const { error } = await supabase
      .from('transactions')
      .upsert(chunk, { onConflict: 'hash' })

    if (error) throw error
  }
}

async function upsertLogs(logs: any[]): Promise<void> {
  if (logs.length === 0) return

  const logData = logs.map(log => ({
    id: `${log.transactionHash}_${parseInt(log.logIndex, 16)}`,
    transaction_hash: log.transactionHash,
    block_number: parseInt(log.blockNumber, 16),
    block_hash: log.blockHash,
    address: log.address,
    topics: log.topics,
    data: log.data,
    log_index: parseInt(log.logIndex, 16),
    removed: log.removed || false
  }))

  // Batch upsert in chunks of 500
  for (let i = 0; i < logData.length; i += 500) {
    const chunk = logData.slice(i, i + 500)
    const { error } = await supabase
      .from('logs')
      .upsert(chunk, { onConflict: 'id' })

    if (error) throw error
  }
}

async function markFinalized(headBlock: bigint): Promise<void> {
  const { error } = await supabase.rpc('mark_finalized', {
    head_block: (headBlock - BigInt(FINALITY_BLOCKS)).toString()
  })

  if (error) throw error
}

async function refreshAnalytics(): Promise<void> {
  const { error } = await supabase.rpc('refresh_analytics')
  if (error) throw error
}

// Main indexer function
async function runIndexer(): Promise<void> {
  try {
    console.log('🚀 Starting blockchain indexer...')

    // Get current cursor
    const { data: cursor, error: cursorError } = await supabase
      .from('index_cursor')
      .select('*')
      .eq('id', 'main')
      .single()

    if (cursorError) throw cursorError

    const lastBlock = BigInt(cursor.last_block)
    const headBlock = await getLatestBlockNumber()

    console.log(`📊 Indexing from block ${lastBlock} to ${headBlock}`)

    if (lastBlock >= headBlock) {
      console.log('✅ Already up to date')
      return
    }

    // Calculate block range with overlap
    const fromBlock = lastBlock > BigInt(OVERLAP_BLOCKS)
      ? lastBlock - BigInt(OVERLAP_BLOCKS)
      : BigInt(0)
    const toBlock = headBlock

    // Limit chunk size for free-tier friendliness
    const actualToBlock = fromBlock + BigInt(CHUNK_SIZE) > toBlock
      ? toBlock
      : fromBlock + BigInt(CHUNK_SIZE)

    console.log(`🎯 Processing blocks ${fromBlock} to ${actualToBlock}`)

    // 1. Fetch logs for the block range
    const logs = await getLogs(fromBlock, actualToBlock)
    console.log(`📋 Found ${logs.length} logs`)

    // 2. Get unique transaction hashes and block numbers
    const txHashes = [...new Set(logs.map(log => log.transactionHash))]
    const blockNumbers = [...new Set([
      ...logs.map(log => BigInt(log.blockNumber)),
      ...Array.from({ length: Number(actualToBlock - fromBlock) + 1 },
        (_, i) => fromBlock + BigInt(i))
    ])]

    // 3. Fetch blocks
    console.log(`🏗️ Fetching ${blockNumbers.length} blocks...`)
    const blocks = []
    for (const blockNum of blockNumbers) {
      try {
        const block = await getBlockByNumber(blockNum, false)
        if (block) blocks.push(block)
      } catch (error) {
        console.error(`Failed to fetch block ${blockNum}:`, error)
      }
    }

    // 4. Fetch transactions from blocks
    const transactions = []
    for (const block of blocks) {
      if (block.transactions) {
        transactions.push(...block.transactions)
      }
    }

    // 5. Fetch receipts for transactions that have logs
    console.log(`🧾 Fetching receipts for ${txHashes.length} transactions...`)
    const receipts = []
    for (const txHash of txHashes) {
      try {
        const receipt = await getTransactionReceipt(txHash)
        if (receipt) receipts.push(receipt)
      } catch (error) {
        console.error(`Failed to fetch receipt for ${txHash}:`, error)
      }
    }

    // 6. Upsert data (idempotent)
    console.log('💾 Upserting data...')
    await upsertBlocks(blocks)
    await upsertTransactions(transactions, receipts)
    await upsertLogs(logs)

    // 7. Mark finalized blocks
    await markFinalized(headBlock)

    // 8. Update cursor
    await updateCursor(actualToBlock)

    // 9. Refresh analytics
    await refreshAnalytics()

    console.log(`✅ Indexed up to block ${actualToBlock}`)

  } catch (error) {
    console.error('❌ Indexer error:', error)
    await updateCursor(BigInt(0), 'error', error.message)
    throw error
  }
}

// HTTP handler
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    await runIndexer()
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Indexer run failed:', error)
    return new Response(JSON.stringify({
      error: 'Indexer run failed',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})