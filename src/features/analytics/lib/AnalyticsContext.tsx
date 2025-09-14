'use client'

import React, {createContext, ReactNode, useContext, useEffect} from 'react'
import {useAuth} from '@/features/auth/lib/AuthContext'
import {AnalyticsContextType} from '../types'
import {useAnalyticsData} from '../hooks/useAnalyticsData'

/**
 * Refactored Analytics Context
 *
 * This context has been simplified by extracting:
 * - types/: Type definitions
 * - hooks/: Data management logic (useAnalyticsData)
 *
 * The context now focuses only on providing the analytics state
 * and connecting it to the authentication context.
 */

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({children}: { children: ReactNode }) {
    const {user: authUser} = useAuth()
    const walletAddress = authUser?.wallet_address

    // Use the analytics data hook
    const analyticsData = useAnalyticsData(walletAddress)

    // Load initial data when wallet address becomes available
    useEffect(() => {
        console.log('Analytics: Wallet address changed:', walletAddress)
        console.log('Analytics: Auth user:', authUser)
        if (walletAddress) {
            console.log('Analytics: Wallet address available, loading initial data')
            analyticsData.refreshData()
        } else {
            console.log('Analytics: No wallet address available, skipping data load')
        }
    }, [walletAddress, analyticsData.refreshData, authUser])

    // Create context value
    const value: AnalyticsContextType = {
        summary: analyticsData.summary,
        dailyStats: analyticsData.dailyStats,
        transactions: analyticsData.transactions,
        isLoading: analyticsData.isLoading,
        error: analyticsData.error,
        refreshData: analyticsData.refreshData,
        loadMoreTransactions: analyticsData.loadMoreTransactions,
        hasMoreTransactions: analyticsData.hasMore,
        user: authUser ? {wallet_address: authUser.wallet_address} : null,
        getIndexerHealth: analyticsData.getIndexerHealth,
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
