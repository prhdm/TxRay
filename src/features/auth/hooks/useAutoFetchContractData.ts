import {useEffect} from 'react';
import {AuthFlowState, AuthUser} from '../types';

/**
 * Hook for automatically fetching contract data when conditions are met
 */
export const useAutoFetchContractData = (
    isAuthenticated: boolean,
    user: AuthUser | null,
    isConnected: boolean,
    connectedAddress: string | undefined,
    authFlowState: AuthFlowState,
    isLoading: boolean,
    fetchContractData: () => Promise<void>
) => {
    // Auto-fetch contract data when user is authenticated, wallet is connected, but contract data is missing
    useEffect(() => {
        const autoFetchContractData = async () => {
            if (
                isAuthenticated &&
                user?.id &&
                user?.wallet_address &&
                isConnected &&
                connectedAddress &&
                connectedAddress.toLowerCase() === user.wallet_address.toLowerCase() &&
                (!user.contractData || !user.contractData.balances || Object.keys(user.contractData.balances).length === 0) &&
                authFlowState === 'completed' &&
                !isLoading
            ) {
                console.log('Auto-fetching contract data for authenticated user with connected wallet');
                try {
                    await fetchContractData();
                } catch (error) {
                    console.error('Auto-fetch contract data failed:', error);
                }
            }
        };

        // Add a small delay to ensure wallet connection is stable
        const timeoutId = setTimeout(autoFetchContractData, 500);
        return () => clearTimeout(timeoutId);
    }, [isAuthenticated, user, isConnected, connectedAddress, authFlowState, isLoading, fetchContractData]);
};
