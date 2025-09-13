import {useCallback} from 'react';
import {AuthFlowState, AuthUser} from '../types';
import {getAuthState, useWalletAuth} from '@/lib/auth';
import {authToasts} from '@/lib/toast';
import {serializeUserData} from '../utils/userSerialization';

/**
 * Hook for handling authentication flow
 */
export const useAuthentication = (
    setAuthFlowState: React.Dispatch<React.SetStateAction<AuthFlowState>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
) => {
    const {authenticate: walletAuthenticate, switchToTaikoHekla, silentReconnect} = useWalletAuth();

    const authenticate = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setAuthFlowState('network_check');
            setIsLoading(true);
            authToasts.connecting();

            // Check if we already have a valid token for this address
            const authState = await getAuthState();
            const tokenWalletAddress = authState.tokenWalletAddress;

            if (tokenWalletAddress && tokenWalletAddress.toLowerCase() === address.toLowerCase() && authState.hasValidToken) {
                console.log('Already have valid token for this address, skipping SIWE');

                // We have a valid token for this address, just set user and complete
                try {
                    const {bootstrapAuth} = await import('@/lib/auth');
                    const userData = await bootstrapAuth();
                    if (userData) {
                        setUser(userData);
                        setAuthFlowState('completed');

                        // Persist user data
                        try {
                            const serializedData = serializeUserData(userData);
                            localStorage.setItem('txray_user', JSON.stringify(serializedData));
                        } catch (storageError) {
                            console.error('Error persisting user data:', storageError);
                        }

                        authToasts.connected(address);
                        return {success: true};
                    }
                } catch (error) {
                    console.error('Failed to get user data despite valid token:', error);
                    // Fall through to silent reconnection
                }
            }

            // First try silent reconnection
            console.log('Attempting silent reconnection for address:', address);
            const silentResult = await silentReconnect(address);

            if (silentResult.success && silentResult.user && silentResult.user.id && silentResult.user.wallet_address) {
                console.log('Silent reconnection successful with complete user data:', silentResult.user);

                // Set user without contract data first - contract data will be fetched separately
                setAuthFlowState('completed');
                setUser(silentResult.user);

                // Persist user data to localStorage (without contract data)
                try {
                    const serializedData = serializeUserData(silentResult.user);
                    localStorage.setItem('txray_user', JSON.stringify(serializedData));
                    console.log('User data persisted to localStorage (contract data will be fetched separately)');
                } catch (storageError) {
                    console.error('Error persisting user data:', storageError);
                }

                console.log('User state updated via silent reconnection - contract data will be fetched separately');
                authToasts.connected(address);
                return {success: true};
            } else if (silentResult.success) {
                console.log('Silent reconnection returned success but incomplete user data:', silentResult.user);
                // Fall through to full SIWE authentication
            }

            // If silent reconnection failed or bootstrap didn't work, proceed with full SIWE
            console.log('Silent reconnection failed or incomplete, proceeding with full SIWE authentication');
            const result = await walletAuthenticate(address);

            // Check if we need to switch chains
            if (!result.success && result.error === 'CHAIN_SWITCH_REQUIRED') {
                console.log('Chain switch required, switching to Taiko Hekla');
                setAuthFlowState('network_switch');
                authToasts.networkSwitch();

                const switchResult = await switchToTaikoHekla();
                if (!switchResult.success) {
                    console.error('Chain switch failed:', switchResult.error);
                    setAuthFlowState('idle');
                    authToasts.authError(switchResult.error || 'Failed to switch network');
                    return {success: false, error: switchResult.error || 'Failed to switch network'};
                }

                // Wait a moment for the chain switch to complete
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Now try authentication again
                console.log('Chain switched successfully, retrying authentication');
                setAuthFlowState('signing');
                authToasts.networkSwitched();
                authToasts.signing();
                const retryResult = await walletAuthenticate(address);

                if (retryResult.success && retryResult.user && retryResult.user.id && retryResult.user.wallet_address) {
                    console.log('Authentication successful after chain switch:', retryResult.user);

                    // Set user without contract data first - contract data will be fetched separately
                    setAuthFlowState('completed');
                    setUser(retryResult.user);

                    // Persist user data to localStorage (without contract data)
                    try {
                        const serializedData = serializeUserData(retryResult.user);
                        localStorage.setItem('txray_user', JSON.stringify(serializedData));
                        console.log('User data persisted to localStorage (contract data will be fetched separately)');
                    } catch (storageError) {
                        console.error('Error persisting user data:', storageError);
                    }

                    console.log('User state updated after chain switch - contract data will be fetched separately');
                    authToasts.authenticated();
                    return {success: true};
                } else {
                    console.error('Authentication failed after chain switch:', retryResult.error);
                    setAuthFlowState('idle');
                    authToasts.authError(retryResult.error || 'Authentication failed after network switch');
                    return {success: false, error: retryResult.error || 'Authentication failed after network switch'};
                }
            } else if (result.success && result.user && result.user.id && result.user.wallet_address) {
                console.log('Full SIWE authentication successful with complete user data:', result.user);

                // Set user without contract data first - contract data will be fetched separately
                setAuthFlowState('completed');
                setUser(result.user);

                // Persist user data to localStorage (without contract data)
                try {
                    const serializedData = serializeUserData(result.user);
                    localStorage.setItem('txray_user', JSON.stringify(serializedData));
                    console.log('User data persisted to localStorage (contract data will be fetched separately)');
                } catch (storageError) {
                    console.error('Error persisting user data:', storageError);
                }

                console.log('User state updated - contract data will be fetched separately, isAuthenticated should now be:', !!result.user);
                authToasts.authenticated();
                return {success: true};
            } else {
                console.error('Authentication failed or incomplete user data:', result.error, result.user);
                setAuthFlowState('idle');
                authToasts.authError(result.error || 'Authentication failed');
                return {success: false, error: result.error || 'Authentication failed'};
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setAuthFlowState('idle');
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            authToasts.authError(errorMessage);
            return {success: false, error: errorMessage};
        } finally {
            setIsLoading(false);
        }
    }, [walletAuthenticate, switchToTaikoHekla, silentReconnect, setAuthFlowState, setIsLoading, setUser]);

    return {authenticate};
};
