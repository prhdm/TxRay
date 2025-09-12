'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge } from '@/ui'
import { RefreshCw, TrendingUp, Users, Activity, DollarSign, Zap, Target, Clock } from 'lucide-react'
import { useAnalytics } from '@/features/analytics/lib/AnalyticsContext'
import { KPICard } from './KPICard'
import { TransactionChart } from './TransactionChart'
import { TransactionPieChart } from './TransactionPieChart'
import { WalletFilter } from './WalletFilter'
import { TransactionTable } from './TransactionTable'

export function AnalyticsDashboard() {
  const {
    summary,
    dailyStats,
    transactions,
    isLoading,
    error,
    refreshData,
    hasMoreTransactions,
    loadMoreTransactions,
  } = useAnalytics()

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setRefreshing(false)
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading analytics: {error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Check the browser console for more details
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If you see network errors, the indexer service may not be deployed yet.
              The dashboard will show fallback data in the meantime.
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  // Show loading state
  if (isLoading && !summary) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
          </div>
          <p className="text-muted-foreground">
            Real-time blockchain analytics
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing || isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Wallet Filter */}
      <WalletFilter />


      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Transactions"
          value={summary?.total_transactions?.toLocaleString() || '0'}
          description="All time"
          icon={<Activity className="h-4 w-4" />}
          trend={summary?.txs_24h ? `+${summary.txs_24h} today` : undefined}
        />
        {/* Show placeholder data if no summary is available */}
        {summary && (
          <>
            <KPICard
              title="Active Addresses"
              value={summary?.unique_addresses?.toLocaleString() || '0'}
              description="Unique addresses"
              icon={<Users className="h-4 w-4" />}
              trend={summary?.active_addresses_24h ? `${summary.active_addresses_24h} active today` : undefined}
            />
            <KPICard
              title="Total Value"
              value={`${(parseFloat(summary?.total_value_transferred || '0') / 1e18).toFixed(2)} ETH`}
              description="Transferred"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KPICard
              title="Gas Fees"
              value={`${(parseFloat(summary?.total_gas_fees || '0') / 1e18).toFixed(4)} ETH`}
              description="Total spent on gas"
              icon={<Zap className="h-4 w-4" />}
            />
          </>
        )}
        <KPICard
          title="Success Rate"
          value={summary?.total_transactions ?
            `${((summary.successful_transactions / summary.total_transactions) * 100).toFixed(1)}%` :
            '0%'
          }
          description="Transaction success rate"
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          title="Avg Gas Used"
          value={summary?.avg_gas_per_tx?.toLocaleString() || '0'}
          description="Per transaction"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Contract Deployments"
          value={summary?.contract_deployments?.toLocaleString() || '0'}
          description="Smart contracts deployed"
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          title="Latest Block"
          value={summary?.latest_block?.toLocaleString() || '0'}
          description="Current block height"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Daily transaction count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionChart data={dailyStats} />
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Distribution by method/contract</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionPieChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest blockchain transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            onLoadMore={loadMoreTransactions}
            hasMore={hasMoreTransactions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Additional Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">24h Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.txs_24h || 0}</div>
            <p className="text-xs text-muted-foreground">Transactions in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">7d Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.txs_7d || 0}</div>
            <p className="text-xs text-muted-foreground">Transactions in last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unique Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.unique_contracts || 0}</div>
            <p className="text-xs text-muted-foreground">Active smart contracts</p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}


