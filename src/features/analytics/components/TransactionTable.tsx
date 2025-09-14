'use client'

import {useMemo, useState} from 'react'
import {Badge, Button} from '@/ui'
import {ChevronDown, ChevronsLeft, ChevronsRight, ChevronUp, ExternalLink, Loader2} from 'lucide-react'
import {Transaction} from '@/features/analytics/types'
import {formatDistanceToNow} from 'date-fns'

interface TransactionTableProps {
    transactions: Transaction[]
}

type SortField = 'value' | 'method' | 'timestamp'
type SortDirection = 'asc' | 'desc'

export function TransactionTable({
                                     transactions
                                 }: TransactionTableProps) {
    const [sortField, setSortField] = useState<SortField>('timestamp')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [currentPage, setCurrentPage] = useState(1)

    const itemsPerPage = 5

    // Sorting function
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            // New field, default to descending
            setSortField(field)
            setSortDirection('desc')
        }
        setCurrentPage(1) // Reset to first page when sorting
    }

    // Sorted and paginated transactions
    const processedTransactions = useMemo(() => {
        // Sort transactions
        const sorted = [...transactions].sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortField) {
                case 'value':
                    aValue = parseFloat(a.value) || 0
                    bValue = parseFloat(b.value) || 0
                    break
                case 'method':
                    aValue = a.method || ''
                    bValue = b.method || ''
                    break
                case 'timestamp':
                    aValue = new Date(a.timestamp).getTime()
                    bValue = new Date(b.timestamp).getTime()
                    break
                default:
                    return 0
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return sorted
    }, [transactions, sortField, sortDirection])

    // Paginate transactions
    const totalPages = Math.ceil(processedTransactions.length / itemsPerPage)
    const paginatedTransactions = processedTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Pagination controls
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    // Sort indicator component
    const SortIndicator = ({field}: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDirection === 'asc' ?
            <ChevronUp className="inline h-4 w-4 ml-1"/> :
            <ChevronDown className="inline h-4 w-4 ml-1"/>
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
        const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL!
        return `${explorerUrl}/tx/${hash}`
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
            <div className="border border-[#191A23] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#191A23]">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-white">Transaction</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-white">From</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-white">To</th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-white cursor-pointer hover:bg-[#191A23]/80 transition-colors"
                                onClick={() => handleSort('value')}
                            >
                                Value <SortIndicator field="value"/>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-white cursor-pointer hover:bg-[#191A23]/80 transition-colors"
                                onClick={() => handleSort('method')}
                            >
                                Method <SortIndicator field="method"/>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-white">Status</th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-white cursor-pointer hover:bg-[#191A23]/80 transition-colors"
                                onClick={() => handleSort('timestamp')}
                            >
                                Time <SortIndicator field="timestamp"/>
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-white">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#191A23]">
                        {paginatedTransactions.map((tx) => (
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
                                    {getStatusBadge(typeof tx.status === 'number' ? tx.status : (tx.success ? 1 : 0))}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm">
                                        {formatDistanceToNow(new Date(tx.timestamp), {addSuffix: true})}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4"/>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronDown className="h-4 w-4 rotate-90"/>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronDown className="h-4 w-4 -rotate-90"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="text-sm text-muted-foreground text-center">
                Showing {paginatedTransactions.length} of {processedTransactions.length} transactions
            </div>
        </div>
    )
}


