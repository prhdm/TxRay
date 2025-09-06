'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface AnalyticsSummary {
  total_transactions: number
  total_blocks: number
  unique_addresses: number
  unique_contracts: number
  successful_transactions: number
  contract_deployments: number
  total_value_transferred: string
  total_gas_fees: string
  avg_gas_per_tx: number
  latest_block: number
  txs_24h: number
  txs_7d: number
  active_addresses_24h: number
}

export interface DailyStats {
  date: string
  total_txs: number
  successful_txs: number
  failed_txs: number
  contract_creations: number
  unique_senders: number
  unique_receivers: number
  total_value: string
  avg_gas_used: number
  total_gas_fees: string
  active_contracts: number
  contract_interactions: number
}

export interface Transaction {
  hash: string
  block_number: number
  from: string
  to: string | null
  value: string
  gas_used: number | null
  gas_price: string | null
  status: number | null
  method: string | null
  timestamp: string
}

export interface WalletFilter {
  wallets: string[]
  enabled: boolean
}

export interface AnalyticsContextType {
  summary: AnalyticsSummary | null
  dailyStats: DailyStats[]
  transactions: Transaction[]
  walletFilter: WalletFilter
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  setWalletFilter: (filter: WalletFilter) => void
  loadMoreTransactions: () => Promise<void>
  hasMoreTransactions: boolean
  userRole: string | null
  isAdmin: boolean
  user: { wallet_address?: string } | null
  searchWallets: (query: string) => Promise<string[]>
  addWalletToFilter: (wallet: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletFilter, setWalletFilter] = useState<WalletFilter>({
    wallets: [],
    enabled: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const getSupabaseUrl = () => {
    // Use the deployed analytics function URL
    return 'https://kwhmqawvfkbnwmpzwnru.supabase.co'
  }

  const fetchSummary = async (): Promise<AnalyticsSummary> => {
    console.log('Fetching analytics summary from:', `${getSupabaseUrl()}/functions/v1/analytics/summary`)
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/analytics/summary`)
    console.log('Analytics summary response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Analytics summary error:', errorText)
      throw new Error(`Failed to fetch analytics summary: ${response.status} ${errorText}`)
    }
    const data = await response.json()
    console.log('Analytics summary data:', data)
    return data
  }

  const fetchDailyStats = async (from?: string, to?: string): Promise<DailyStats[]> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const response = await fetch(
      `${getSupabaseUrl()}/functions/v1/analytics/daily?${params}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch daily statistics')
    }
    return response.json()
  }

  const fetchTransactions = async (cursor?: string): Promise<{
    transactions: Transaction[]
    next_cursor: string | null
  }> => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    params.set('limit', '100')

    const response = await fetch(
      `${getSupabaseUrl()}/functions/v1/analytics/txs?${params}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    return response.json()
  }

  const refreshData = async () => {
    console.log('Starting analytics data refresh...')
    setIsLoading(true)
    setError(null)

    try {
      console.log('Fetching summary, daily stats, and transactions...')
      const [summaryData, dailyData, txData] = await Promise.all([
        fetchSummary(),
        fetchDailyStats(),
        fetchTransactions()
      ])

      console.log('Data fetched successfully:', {
        summary: summaryData,
        dailyStatsCount: dailyData.length,
        transactionsCount: txData.transactions.length
      })

      setSummary(summaryData)
      setDailyStats(dailyData)
      setTransactions(txData.transactions)
      setNextCursor(txData.next_cursor)
      setHasMoreTransactions(txData.transactions.length === 100)

      console.log('Analytics data loaded successfully')
    } catch (err) {
      console.error('Analytics data loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreTransactions = async () => {
    if (!nextCursor || !hasMoreTransactions) return

    try {
      const txData = await fetchTransactions(nextCursor)
      setTransactions(prev => [...prev, ...txData.transactions])
      setNextCursor(txData.next_cursor)
      setHasMoreTransactions(txData.transactions.length === 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more transactions')
    }
  }

  const searchWallets = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(`${getSupabaseUrl()}/functions/v1/analytics/search-wallets?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search wallets')
      }
      return response.json()
    } catch (err) {
      console.error('Wallet search error:', err)
      return []
    }
  }

  const addWalletToFilter = (wallet: string) => {
    const normalizedWallet = wallet.toLowerCase()
    if (!walletFilter.wallets.includes(normalizedWallet)) {
      setWalletFilter({
        ...walletFilter,
        wallets: [...walletFilter.wallets, normalizedWallet]
      })
    }
  }

  // Update user role when auth user changes
  useEffect(() => {
    if (authUser?.role) {
      setUserRole(authUser.role)
    } else if (authUser) {
      // Default to 'user' role if authenticated but no role specified
      setUserRole('user')
    } else {
      setUserRole(null)
    }
  }, [authUser])

  useEffect(() => {
    refreshData()
  }, [])

  const value: AnalyticsContextType = {
    summary,
    dailyStats,
    transactions,
    walletFilter,
    isLoading,
    error,
    refreshData,
    setWalletFilter,
    loadMoreTransactions,
    hasMoreTransactions,
    userRole,
    isAdmin: userRole === 'admin',
    user: authUser,
    searchWallets,
    addWalletToFilter
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}


