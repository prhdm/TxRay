// Analytics API client for the indexer endpoints
// Base URL: https://kwhmqawvfkbnwmpzwnru.supabase.co/functions/v1/indexer

import { getAccessToken } from './auth';

export interface IndexerSummary {
    total_transactions: number
    total_gas_cost_wei: string
    total_gas_cost_eth: string
    first_tx_at: string
    last_tx_at: string
    latest_block: number
    txs_24h: number
    txs_7d: number
    avg_gas_per_tx: number
}

export interface TimeSeriesDataPoint {
  period: string
  transaction_count: number
  gas_used: string
  gas_cost: string
  // Add any other fields your kpi_timeseries function returns
}

export interface IndexerTransaction {
  tx_hash: string
  block_number: number
  block_timestamp: string
  from_address: string
  to_address: string
  value_wei: string
  gas_used: string
  effective_gas_price_wei: string
  gas_cost_wei: string
  method: string
  status: boolean
}

export interface HealthInfo {
  index_cursor: {
    id: number
    last_block_number: number
    last_run_at: string
  } | null
}

export type TimeseriesGranularity = 'minute' | 'hour' | 'day' | 'week'

class AnalyticsApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL!

  // Debug method to test basic connectivity
  async testConnection(): Promise<{status: number, ok: boolean, response?: any}> {
    try {
      const response = await fetch(this.baseUrl + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      return {
        status: response.status,
        ok: response.ok,
        response: response.ok ? await response.json() : await response.text()
      }
    } catch (error) {
      return {
        status: 0,
        ok: false,
        response: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`
    console.log('🔍 Analytics API Request:', {
      url: fullUrl,
      method: options?.method || 'GET',
      hasToken: false, // We'll log this after getting the token
    })

    // Get access token for authentication
    const token = await getAccessToken()
    console.log('🔑 Access token available:', !!token)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers)
    }

    try {
      console.log('📡 Making fetch request to:', fullUrl)
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          const errorData = await response.json()
          console.error('❌ API Error Response:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          try {
            const textError = await response.text()
            console.error('❌ Raw error response:', textError)
            if (textError) errorMessage = textError
          } catch (textError) {
            console.error('❌ Failed to read error response as text:', textError)
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ API Response data:', data)
      return data

    } catch (error) {
      console.error('💥 Fetch error:', error)

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚫 Network/CORS error. Possible causes:')
        console.error('  - Supabase function not deployed')
        console.error('  - CORS policy blocking request')
        console.error('  - Network connectivity issue')
        console.error('  - Incorrect Supabase URL')
      }

      throw error
    }
  }

    /**
     * Get KPI summary (total transactions, gas, costs, date range)
     * @param walletAddress - Optional wallet address to filter by. If not provided, returns global summary.
     */
    async getSummary(walletAddress?: string): Promise<IndexerSummary> {
        const endpoint = walletAddress ? `/summary?wallet=${walletAddress}` : '/summary'
        return this.request<IndexerSummary>(endpoint)
    }

    /**
     * Get global KPI summary (all wallets)
     */
    async getAllSummary(): Promise<IndexerSummary> {
        return this.request<IndexerSummary>('/all')
    }

    /**
     * Get time-series data with specified granularity and date range
     * @param params - Query parameters including optional wallet address
     */
    async getTimeseries(params: {
        granularity?: TimeseriesGranularity
        from?: string // ISO date string
        to?: string   // ISO date string
        walletAddress?: string // Optional wallet address to filter by
    } = {}): Promise<TimeSeriesDataPoint[]> {
        const searchParams = new URLSearchParams()

        if (params.granularity) {
            searchParams.set('granularity', params.granularity)
        }
        if (params.from) {
            searchParams.set('from', params.from)
        }
        if (params.to) {
            searchParams.set('to', params.to)
        }
        if (params.walletAddress) {
            searchParams.set('wallet', params.walletAddress)
        }

        const query = searchParams.toString()
        const endpoint = query ? `/timeseries?${query}` : '/timeseries'

        return this.request<TimeSeriesDataPoint[]>(endpoint)
  }

    /**
     * Get recent transactions with pagination
     * @param params - Query parameters including optional wallet address
     */
    async getTransactions(params: {
        limit?: number  // max 500, default 50
        offset?: number // default 0
        walletAddress?: string // Optional wallet address to filter by
    } = {}): Promise<IndexerTransaction[]> {
        const searchParams = new URLSearchParams()

        if (params.limit !== undefined) {
            searchParams.set('limit', Math.min(500, Math.max(1, params.limit)).toString())
        }
        if (params.offset !== undefined) {
            searchParams.set('offset', Math.max(0, params.offset).toString())
        }
        if (params.walletAddress) {
            searchParams.set('wallet', params.walletAddress)
        }

        const query = searchParams.toString()
        const endpoint = query ? `/txs?${query}` : '/txs'

        return this.request<IndexerTransaction[]>(endpoint)
  }

  /**
   * Get indexer health/status information
   */
  async getHealth(): Promise<HealthInfo> {
    return this.request<HealthInfo>('/health')
  }

}

// Singleton instance
export const analyticsApi = new AnalyticsApiClient()

// Export the test function for debugging
export const testAnalyticsConnection = () => analyticsApi.testConnection()

// Global debug functions for browser console (read-only operations only)
if (typeof window !== 'undefined') {
  (window as any).testIndexerConnection = testAnalyticsConnection
  ;(window as any).testIndexerSummary = () => analyticsApi.getSummary()
  ;(window as any).testIndexerHealth = () => analyticsApi.getHealth()
  ;(window as any).testIndexerTransactions = (limit = 5) => analyticsApi.getTransactions({ limit })
}

// Helper functions to transform data for existing components
export function transformSummaryForLegacyComponents(summary: IndexerSummary): any {
    return {
        total_transactions: summary.total_transactions,
        total_gas_fees: summary.total_gas_cost_wei,
        // Map other fields as needed for backward compatibility
        total_blocks: 0, // Not available from indexer
        unique_addresses: 0, // Not available from indexer
        unique_contracts: 0, // Not available from indexer
        successful_transactions: summary.total_transactions, // Assuming all indexed are successful
        contract_deployments: 0, // Not available from indexer
        total_value_transferred: "0", // Not tracking value transfers in current indexer
        avg_gas_per_tx: summary.avg_gas_per_tx,
        latest_block: summary.latest_block,
        txs_24h: summary.txs_24h,
        txs_7d: summary.txs_7d,
        active_addresses_24h: 0, // Not available from indexer
    }
}

export function transformTransactionForLegacyComponents(tx: IndexerTransaction): any {
  return {
    hash: tx.tx_hash || '',
    block_number: tx.block_number || 0,
    from: tx.from_address || '',
    to: tx.to_address || null,
    value: tx.value_wei || '0',
    gas_used: tx.gas_used ? parseInt(tx.gas_used) : null,
    gas_price: tx.effective_gas_price_wei || null,
    status: tx.status ? 1 : 0,
    method: tx.method || null,
    timestamp: tx.block_timestamp || new Date().toISOString(),
  }
}

export function transformTimeseriesForLegacyComponents(data: TimeSeriesDataPoint[]): any[] {
    return data.map((point, index) => {
        // Ensure we have a valid date
        let date = point.period
        if (!date) {
            // Generate a fallback date if period is missing
            const fallbackDate = new Date()
            fallbackDate.setDate(fallbackDate.getDate() - (data.length - index - 1))
            date = fallbackDate.toISOString().split('T')[0] // YYYY-MM-DD format
        }

        return {
            date: date,
            total_txs: point.transaction_count || 0,
            successful_txs: point.transaction_count || 0, // Assuming all indexed are successful
            failed_txs: 0, // We don't track failed transactions in the current setup
            contract_creations: 0, // Not available
            unique_senders: 0, // Not available
            unique_receivers: 0, // Not available
            total_value: "0", // Not tracking
            avg_gas_used: point.transaction_count > 0 && point.gas_used
                ? Math.round(parseInt(point.gas_used) / point.transaction_count)
                : 0,
            total_gas_fees: point.gas_cost || "0",
            active_contracts: 0, // Not available
            contract_interactions: point.transaction_count || 0,
        }
    })
}
