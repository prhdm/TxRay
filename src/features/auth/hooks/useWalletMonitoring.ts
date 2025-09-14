import {useEffect} from 'react';
import {AuthFlowState, AuthUser} from '../types';
import {getAuthState, useWalletAuth} from '@/lib/auth';
import {serializeUserData} from '../utils/userSerialization';

/**
 * Hook for monitoring wallet connection and handling authentication scenarios
 */
export const useWalletMonitoring = (
    user: AuthUser | null,
    isAuthenticated: boolean,
    authFlowState: AuthFlowState,
    isLoading: boolean,
    isConnected: boolean,
    connectedAddress: string | undefined,
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
    setAuthFlowState: React.Dispatch<React.SetStateAction<AuthFlowState>>
) => {
    const {silentReconnect} = useWalletAuth();

    // Monitor wallet connection and handle all authentication scenarios
    useEffect(() => {
        const handleWalletConnectionScenarios = async () => {
            if (isLoading) {
                console.log('Still loading, skipping wallet connection check');
                return;
            }

            console.log('Wallet connection check:', {
                isConnected,
                connectedAddress,
                isAuthenticated,
                authFlowState,
                hasUser: !!user,
                userWalletAddress: user?.wallet_address
            });

            // Get current auth state
            const authState = await getAuthState();
            const tokenWalletAddress = authState.tokenWalletAddress;

            // Scenario: Valid token, no connected wallet -> show connecting wallet dialog
            if (tokenWalletAddress && !isConnected && !connectedAddress && isAuthenticated) {
                console.log('Scenario: Valid token, no connected wallet -> user needs to connect wallet');
                // The needsWalletConnection flag will show the connect button
                return;
            }

            // Scenario: Valid token, connected wallet, same address -> do nothing
            if (tokenWalletAddress && isConnected && connectedAddress &&
                tokenWalletAddress.toLowerCase() === connectedAddress.toLowerCase() && isAuthenticated) {
                console.log('Scenario: Valid token, connected wallet, same address -> all good, doing nothing');
                return;
            }

            // Scenario: Valid token, connected wallet, different address -> show normal flow with SIWE
            if (tokenWalletAddress && isConnected && connectedAddress &&
                tokenWalletAddress.toLowerCase() !== connectedAddress.toLowerCase()) {
                console.log('Scenario: Valid token, connected wallet, different address -> need to re-authenticate with new wallet');
                console.log(`Token wallet: ${tokenWalletAddress}, Connected wallet: ${connectedAddress}`);

                // Clear current user and start fresh authentication
                setUser(null);
                setAuthFlowState('idle');

                // Clear persisted data since we're switching wallets
                localStorage.removeItem('txray_user');
                localStorage.removeItem('txray_access_token');
                localStorage.removeItem('txray_token_expiry');

                // The user will need to click connect to start SIWE flow with new wallet
                return;
            }

            // Scenario: Wallet connected but not authenticated - attempt silent reconnection
            if (isConnected && connectedAddress && !isAuthenticated && authFlowState === 'idle') {
                console.log('Wallet connected but not authenticated, attempting silent reconnection for:', connectedAddress);
                try {
                    const result = await silentReconnect(connectedAddress);
                    if (result.success && result.user) {
                        console.log('Silent reconnection successful:', result.user);
                        setUser(result.user);
                        setAuthFlowState('completed');

                        // Persist user data
                        try {
                            const serializedData = serializeUserData(result.user);
                            localStorage.setItem('txray_user', JSON.stringify(serializedData));
                            console.log('User data persisted after silent reconnection');
                        } catch (storageError) {
                            console.error('Error persisting user data after silent reconnection:', storageError);
                        }
                    } else {
                        console.log('Silent reconnection failed:', result.error);
                        // Don't clear anything here, let the user manually trigger authentication
                    }
                } catch (error) {
                    console.error('Silent reconnection error:', error);
                }
            }
        };

        handleWalletConnectionScenarios();
    }, [
        isConnected,
        connectedAddress,
        isAuthenticated,
        authFlowState,
        isLoading,
        silentReconnect,
        user,
        setUser,
        setAuthFlowState
    ]);
};
