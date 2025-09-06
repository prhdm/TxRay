'use client'

import { useState } from 'react'
import { Button } from '@txray/ui'
import { Badge } from '@txray/ui'
import { ExternalLink, ChevronDown, Loader2 } from 'lucide-react'
import { Transaction } from '../contexts/AnalyticsContext'
import { formatDistanceToNow } from 'date-fns'

interface TransactionTableProps {
  transactions: Transaction[]
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
}

export function TransactionTable({
  transactions,
  onLoadMore,
  hasMore,
  isLoading
}: TransactionTableProps) {
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await onLoadMore()
    setLoadingMore(false)
  }

  const getStatusBadge = (status: number | null) => {
    if (status === null) return <Badge variant="secondary">Pending</Badge>
    if (status === 1) return <Badge variant="default">Success</Badge>
    return <Badge variant="destructive">Failed</Badge>
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatValue = (value: string) => {
    const num = parseFloat(value)
    if (num === 0) return '0 ETH'
    if (num < 0.001) return '< 0.001 ETH'
    return `${num.toFixed(4)} ETH`
  }

  const getExplorerUrl = (hash: string) => {
    return `https://hekla.taikoscan.io/tx/${hash}`
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Transaction</th>
                <th className="px-4 py-3 text-left text-sm font-medium">From</th>
                <th className="px-4 py-3 text-left text-sm font-medium">To</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">
                      {formatAddress(tx.hash)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Block #{tx.block_number.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">
                      {formatAddress(tx.from)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">
                      {tx.to ? formatAddress(tx.to) : 'Contract Deploy'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">
                      {formatValue(tx.value)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tx.method ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {tx.method}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore || isLoading}
            variant="outline"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More Transactions
              </>
            )}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {transactions.length} transactions
        {!hasMore && transactions.length > 0 && ' • No more transactions to load'}
      </div>
    </div>
  )
}


