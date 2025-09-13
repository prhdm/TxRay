import {useCallback} from 'react';
import {AuthFlowState, AuthUser} from '../types';
import {serializeUserData} from '../utils/userSerialization';

/**
 * Hook for managing contract data fetching and refreshing
 */
export const useContractData = (
    user: AuthUser | null,
    authFlowState: AuthFlowState,
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
) => {
    const fetchContractData = useCallback(async () => {
        // Only fetch contract data if user is fully authenticated
        if (!user?.id || !user?.wallet_address || authFlowState !== 'completed') {
            console.error('User not fully authenticated, cannot fetch contract data');
            return;
        }

        if (user.contractData) {
            console.log('Contract data already exists, skipping fetch');
            return;
        }

        try {
            console.log('Fetching contract data for fully authenticated user:', user.wallet_address);
            const {fetchUserContractData} = await import('@/lib/auth');
            const contractData = await fetchUserContractData(user.wallet_address);

            if (contractData) {
                setUser(prevUser => prevUser ? {...prevUser, contractData} : null);

                // Update localStorage
                try {
                    const updatedUser = {...user, contractData};
                    const serializedData = serializeUserData(updatedUser);
                    localStorage.setItem('txray_user', JSON.stringify(serializedData));
                    console.log('Contract data fetched and persisted');
                } catch (storageError) {
                    console.error('Error persisting contract data:', storageError);
                }
            } else {
                console.warn('No contract data received from fetchUserContractData');
            }
        } catch (error) {
            console.error('Failed to fetch contract data:', error);
        }
    }, [user, authFlowState, setUser]);

    const refreshContractData = useCallback(async () => {
        // Only refresh contract data if user is fully authenticated
        if (!user?.id || !user?.wallet_address || authFlowState !== 'completed') {
            console.error('User not fully authenticated, cannot refresh contract data');
            return;
        }

        try {
            const {refreshUserContractData} = await import('@/lib/auth');
            const contractData = await refreshUserContractData();

            if (contractData) {
                setUser(prevUser => prevUser ? {...prevUser, contractData} : null);

                // Update localStorage
                try {
                    const updatedUser = {...user, contractData};
                    const serializedData = serializeUserData(updatedUser);
                    localStorage.setItem('txray_user', JSON.stringify(serializedData));
                    console.log('Contract data refreshed and persisted');
                } catch (storageError) {
                    console.error('Error persisting refreshed contract data:', storageError);
                }
            }
        } catch (error) {
            console.error('Failed to refresh contract data:', error);
        }
    }, [user, authFlowState, setUser]);

    return {
        fetchContractData,
        refreshContractData,
    };
};
