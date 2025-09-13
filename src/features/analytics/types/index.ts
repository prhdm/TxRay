// Analytics types and interfaces

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
    gas_limit: number | null
    timestamp: string
    success: boolean
    status: boolean
    method: string | null
    function_name: string | null
    contract_address: string | null
    transaction_type: 'contract_creation' | 'contract_call' | 'transfer' | 'other'
    input_data: string | null
    logs: any[] | null
    token_transfers: any[] | null
    nft_transfers: any[] | null
    internal_txs: any[] | null
    error_message: string | null
}

export interface AnalyticsContextType {
    summary: AnalyticsSummary | null
    dailyStats: DailyStats[]
    transactions: Transaction[]
    isLoading: boolean
    error: string | null
    refreshData: () => Promise<void>
    loadMoreTransactions: () => Promise<void>
    hasMoreTransactions: boolean
    user: { wallet_address?: string } | null
    getIndexerHealth: () => Promise<any>
}

export type TimeseriesGranularity = 'hour' | 'day' | 'week' | 'month';

export interface AnalyticsState {
    summary: AnalyticsSummary | null;
    dailyStats: DailyStats[];
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
}
