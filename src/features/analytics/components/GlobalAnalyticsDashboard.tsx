'use client'

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/ui'
import { Activity, BarChart3, Calendar, Clock, PieChart, RefreshCw, Table, TrendingUp, Zap } from 'lucide-react'
import { useGlobalAnalyticsData } from '@/features/analytics/hooks/useGlobalAnalyticsData'
import { KPICard } from './KPICard'
import { TransactionChart } from './TransactionChart'
import { TransactionPieChart } from './TransactionPieChart'
import { TransactionTable } from './TransactionTable'

interface GlobalAnalyticsDashboardProps {
    onRefresh?: () => void
    isRefreshing?: boolean
}

export function GlobalAnalyticsDashboard({ onRefresh, isRefreshing }: GlobalAnalyticsDashboardProps) {
    const {
        summary,
        dailyStats,
        transactions,
        isLoading,
        error,
        refreshData,
        hasMore,
        loadMoreTransactions,
    } = useGlobalAnalyticsData()

    // Debug logging to help identify data issues
    console.log('GlobalAnalyticsDashboard - Summary data:', summary)
    console.log('GlobalAnalyticsDashboard - Daily stats:', dailyStats)
    console.log('GlobalAnalyticsDashboard - Transactions count:', transactions.length)

    const handleRefresh = async () => {
        await refreshData()
        onRefresh?.()
    }

    if (error) {
        return (
            <Card className="p-6">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error loading global analytics: {error}</p>
                    <p className="text-sm text-gray-500 mb-4">
                        Check the browser console for more details
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> If you see network errors, the indexer service may not be deployed
                            yet. The dashboard will show fallback data in the meantime.
                        </p>
                    </div>
                    <Button onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
                        Retry
                    </Button>
                </div>
            </Card>
        )
    }

    if (isLoading && !summary) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading global analytics data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                <div className="grid gap-4 grid-cols-2">
                    <KPICard
                        title="Total Transactions"
                        value={summary?.total_transactions?.toLocaleString() || '0'}
                        description="All wallets"
                        icon={<Activity className="h-4 w-4"/>}
                        trend={summary?.txs_24h ? `+${summary.txs_24h} today` : undefined}
                        tooltip="Total number of transactions across all wallets"
                    />
                    <Card className="h-full flex flex-col">
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
                                        <p>Number of transactions across all wallets in the last 24 hours</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center">
                            <div className="text-2xl font-bold">{summary?.txs_24h || 0}</div>
                            <p className="text-xs text-muted-foreground">All wallets - last 24h</p>
                        </CardContent>
                    </Card>
                    {summary && (
                        <KPICard
                            title="Total Gas Fees"
                            value={`${(parseFloat(summary?.total_gas_fees || '0') / 1e18).toFixed(4)} ETH`}
                            description="All wallets"
                            icon={<Zap className="h-4 w-4"/>}
                            tooltip="Total amount of ETH spent on gas fees across all wallets"
                        />
                    )}
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">7d Activity</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-muted-foreground">
                                            <Calendar className="h-4 w-4"/>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Number of transactions across all wallets in the last 7 days</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center">
                            <div className="text-2xl font-bold">{summary?.txs_7d || 0}</div>
                            <p className="text-xs text-muted-foreground">All wallets - last 7 days</p>
                        </CardContent>
                    </Card>
                </div>
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle>Global Transaction Volume</CardTitle>
                            <CardDescription>Daily transaction count across all wallets</CardDescription>
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-muted-foreground">
                                        <BarChart3 className="h-4 w-4"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Visual representation of global transaction activity over time</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <TransactionChart data={dailyStats}/>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle>Transaction Types</CardTitle>
                            <CardDescription>Distribution by method across all wallets</CardDescription>
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="text-muted-foreground">
                                        <PieChart className="h-4 w-4"/>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Breakdown of different types of transactions across all wallets</p>
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
                                tooltip="Average amount of gas consumed per transaction across all wallets"
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
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest blockchain transactions from all wallets</CardDescription>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-muted-foreground">
                                    <Table className="h-4 w-4"/>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Detailed list of the most recent blockchain transactions from all wallets</p>
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
