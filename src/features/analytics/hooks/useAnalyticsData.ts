import {useCallback, useState} from 'react';
import {AnalyticsState} from '../types';
import {
    analyticsApi,
    transformSummaryForLegacyComponents,
    transformTimeseriesForLegacyComponents,
    transformTransactionForLegacyComponents
} from '@/lib/analytics-api';

/**
 * Hook for managing analytics data state and operations
 */
export const useAnalyticsData = (walletAddress?: string) => {
    const [state, setState] = useState<AnalyticsState>({
        summary: null,
        dailyStats: [],
        transactions: [],
        isLoading: false,
        error: null,
        page: 1,
        hasMore: true,
    });

    const setLoading = useCallback((loading: boolean) => {
        setState(prev => ({...prev, isLoading: loading}));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({...prev, error}));
    }, []);

    const loadSummary = useCallback(async () => {
        if (!walletAddress) return;

        try {
            console.log('Loading analytics summary for wallet:', walletAddress);
            const response = await analyticsApi.getSummary(walletAddress);
            const transformedSummary = transformSummaryForLegacyComponents(response);

            setState(prev => ({
                ...prev,
                summary: transformedSummary,
                error: null
            }));
        } catch (error) {
            console.error('Failed to load summary:', error);
            setState(prev => ({
                ...prev,
                summary: null,
                error: error instanceof Error ? error.message : 'Failed to load summary'
            }));
        }
    }, [walletAddress]);

    const loadDailyStats = useCallback(async () => {
        if (!walletAddress) return;

        try {
            console.log('Loading daily stats for wallet:', walletAddress);
            const response = await analyticsApi.getTimeseries({
                granularity: 'day',
                walletAddress: walletAddress
            });
            const transformedStats = transformTimeseriesForLegacyComponents(response);

            setState(prev => ({
                ...prev,
                dailyStats: transformedStats,
                error: null
            }));
        } catch (error) {
            console.error('Failed to load daily stats:', error);
            setState(prev => ({
                ...prev,
                dailyStats: [],
                error: error instanceof Error ? error.message : 'Failed to load daily stats'
            }));
        }
    }, [walletAddress]);

    const loadTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
        if (!walletAddress) return;

        try {
            console.log(`Loading transactions page ${page} for wallet:`, walletAddress);
            const response = await analyticsApi.getTransactions({
                offset: (page - 1) * 20,
                limit: 20,
                walletAddress: walletAddress
            });

            const transformedTransactions = response.map(transformTransactionForLegacyComponents);
            const hasMore = response.length === 20;

            setState(prev => ({
                ...prev,
                transactions: append ? [...prev.transactions, ...transformedTransactions] : transformedTransactions,
                page: page,
                hasMore,
                error: null
            }));
        } catch (error) {
            console.error('Failed to load transactions:', error);
            setState(prev => ({
                ...prev,
                transactions: append ? prev.transactions : [],
                error: error instanceof Error ? error.message : 'Failed to load transactions'
            }));
        }
    }, [walletAddress]);

    const loadMoreTransactions = useCallback(async () => {
        if (!state.hasMore || state.isLoading) return;

        setLoading(true);
        try {
            await loadTransactions(state.page + 1, true);
        } finally {
            setLoading(false);
        }
    }, [state.hasMore, state.isLoading, state.page, loadTransactions, setLoading]);

    const refreshData = useCallback(async () => {
        if (!walletAddress) return;

        setLoading(true);
        setError(null);

        try {
            await Promise.all([
                loadSummary(),
                loadDailyStats(),
                loadTransactions(1, false),
            ]);
        } catch (error) {
            console.error('Failed to refresh analytics data:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }, [walletAddress, loadSummary, loadDailyStats, loadTransactions, setLoading, setError]);

    const getIndexerHealth = useCallback(async () => {
        try {
            return await analyticsApi.getHealth();
        } catch (error) {
            console.error('Failed to get indexer health:', error);
            throw error;
        }
    }, []);

    return {
        ...state,
        refreshData,
        loadMoreTransactions,
        getIndexerHealth,
    };
};
