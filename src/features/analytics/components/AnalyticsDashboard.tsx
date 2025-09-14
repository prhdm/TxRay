'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui'
import { RefreshCw, TrendingUp, Users, Activity, DollarSign, Zap, Target, Clock, BarChart3, PieChart, Table } from 'lucide-react'
import { useAnalytics } from '@/features/analytics/lib/AnalyticsContext'
import { KPICard } from './KPICard'
import { TransactionChart } from './TransactionChart'
import { TransactionPieChart } from './TransactionPieChart'
import { TransactionTable } from './TransactionTable'

interface AnalyticsDashboardProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function AnalyticsDashboard({ onRefresh, isRefreshing }: AnalyticsDashboardProps) {
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

  // Debug logging to help identify data issues
  console.log('AnalyticsDashboard - Summary data:', summary)
  console.log('AnalyticsDashboard - Daily stats:', dailyStats)
  console.log('AnalyticsDashboard - Transactions count:', transactions.length)

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setRefreshing(false)
    onRefresh?.()
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
        <Button onClick={handleRefresh} disabled={refreshing || isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${(refreshing || isRefreshing) ? 'animate-spin' : ''}`} />
          Retry
        </Button>
        </div>
      </Card>
    )
  }

  // Show loading state
  if (isLoading && !summary) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* First Row: KPI Cards + Timeseries Chart */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <div className="grid gap-4 grid-cols-2">
          <KPICard
            title="Total Transactions"
            value={summary?.total_transactions?.toLocaleString() || '0'}
            description="Your wallet"
            icon={<Activity className="h-4 w-4"/>}
            trend={summary?.txs_24h ? `+${summary.txs_24h} today` : undefined}
            tooltip="Total number of transactions from your wallet"
            className="bg-[#F3F3F3]"
          />
          <Card className="h-full flex flex-col bg-[#F3F3F3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Activity</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground">
                      <BarChart3 className="h-4 w-4"/>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of transactions from your wallet in the last 24 hours</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold">{summary?.txs_24h || 0}</div>
              <p className="text-xs text-muted-foreground">Your wallet - last 24h</p>
            </CardContent>
          </Card>
          {summary && (
            <KPICard
              title="Total Gas Fees"
              value={`${(parseFloat(summary?.total_gas_fees || '0') / 1e18).toFixed(4)} ETH`}
              description="Your wallet"
              icon={<Zap className="h-4 w-4"/>}
              tooltip="Total amount of ETH spent on gas fees from your wallet"
              className="bg-[#F3F3F3]"
            />
          )}
          <Card className="h-full flex flex-col bg-[#F3F3F3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">7d Activity</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground">
                      <BarChart3 className="h-4 w-4"/>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of transactions from your wallet in the last 7 days</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold">{summary?.txs_7d || 0}</div>
              <p className="text-xs text-muted-foreground">Your wallet - last 7 days</p>
            </CardContent>
          </Card>
        </div>
        <Card className="flex flex-col bg-[#F3F3F3] focus:outline-none focus:ring-0 focus:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Transaction Volume</CardTitle>
              <CardDescription>Daily transaction count from your wallet</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground">
                    <BarChart3 className="h-4 w-4"/>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visual representation of your wallet&apos;s transaction activity over time</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <TransactionChart data={dailyStats}/>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Pie Chart + Additional KPIs */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex flex-col bg-[#F3F3F3] focus:outline-none focus:ring-0 focus:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Transaction Types</CardTitle>
              <CardDescription>Distribution by method from your wallet</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground">
                    <PieChart className="h-4 w-4"/>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Breakdown of different types of transactions from your wallet</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <TransactionPieChart transactions={transactions}/>
          </CardContent>
        </Card>
        <div className="flex flex-col space-y-4 h-full">
          <div className="flex-1">
            <div className="h-full">
              <KPICard
                title="Avg Gas Used"
                value={`${summary?.avg_gas_per_tx?.toLocaleString() || '0'} wei`}
                description="Per transaction"
                icon={<TrendingUp className="h-4 w-4"/>}
                tooltip="Average amount of gas consumed per transaction from your wallet"
                className="bg-[#F3F3F3]"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="h-full">
              <KPICard
                title="Latest Block"
                value={summary?.latest_block?.toLocaleString() || '0'}
                description="Current block height"
                icon={<Clock className="h-4 w-4"/>}
                tooltip="The most recent block number on the blockchain"
                className="bg-[#F3F3F3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <Card className="bg-[#F3F3F3] focus:outline-none focus:ring-0 focus:border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest blockchain transactions from your wallet</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground">
                  <Table className="h-4 w-4"/>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Detailed list of the most recent blockchain transactions from your wallet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
          />
        </CardContent>
      </Card>
    </div>
  )
}


