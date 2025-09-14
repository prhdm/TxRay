import { useCallback, useState } from 'react';
import { AnalyticsState } from '../types';
import {
    analyticsApi,
    transformSummaryForLegacyComponents,
    transformTimeseriesForLegacyComponents,
    transformTransactionForLegacyComponents
} from '@/lib/analytics-api';

/**
 * Hook for managing global analytics data (all wallets)
 */
export const useGlobalAnalyticsData = () => {
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
        try {
            console.log('useGlobalAnalyticsData: Loading global analytics summary');
            const response = await analyticsApi.getAllSummary();
            console.log('useGlobalAnalyticsData: Raw API response:', response);
            const transformedSummary = transformSummaryForLegacyComponents(response);
            console.log('useGlobalAnalyticsData: Transformed summary:', transformedSummary);

            setState(prev => ({
                ...prev,
                summary: transformedSummary,
                error: null
            }));
        } catch (error) {
            console.error('useGlobalAnalyticsData: Failed to load global summary:', error);
            setState(prev => ({
                ...prev,
                summary: null,
                error: error instanceof Error ? error.message : 'Failed to load global summary'
            }));
        }
    }, []);

    const loadDailyStats = useCallback(async () => {
        try {
            console.log('Loading global daily stats');
            const response = await analyticsApi.getTimeseries({granularity: 'day'});
            const transformedStats = transformTimeseriesForLegacyComponents(response);

            setState(prev => ({
                ...prev,
                dailyStats: transformedStats,
                error: null
            }));
        } catch (error) {
            console.error('Failed to load global daily stats:', error);
            setState(prev => ({
                ...prev,
                dailyStats: [],
                error: error instanceof Error ? error.message : 'Failed to load global daily stats'
            }));
        }
    }, []);

    const loadTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            console.log(`Loading global transactions page ${page}`);
            const response = await analyticsApi.getTransactions({
                offset: (page - 1) * 20,
                limit: 20,
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
            console.error('Failed to load global transactions:', error);
            setState(prev => ({
                ...prev,
                transactions: append ? prev.transactions : [],
                error: error instanceof Error ? error.message : 'Failed to load global transactions'
            }));
        }
    }, []);

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
        setLoading(true);
        setError(null);

        try {
            await Promise.all([
                loadSummary(),
                loadDailyStats(),
                loadTransactions(1, false),
            ]);
        } catch (error) {
            console.error('Failed to refresh global analytics data:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh data');
        } finally {
            setLoading(false);
        }
    }, [loadSummary, loadDailyStats, loadTransactions, setLoading, setError]);

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
