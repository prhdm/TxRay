import {useEffect} from 'react';
import {useAccount} from 'wagmi';
import {AuthFlowState, AuthUser} from '../types';
import {getAuthState} from '@/lib/auth';
import {supabase} from '@/lib/supabase';
import {deserializeUserData, serializeUserData} from '../utils/userSerialization';

/**
 * Hook for managing authentication session restoration and monitoring
 */
export const useAuthSession = (
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
    setAuthFlowState: React.Dispatch<React.SetStateAction<AuthFlowState>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    isLoading: boolean
) => {
    const {address: connectedAddress, isConnected} = useAccount();
    // Check for existing session on mount and handle comprehensive auth state
    useEffect(() => {
        const checkSession = async () => {
            try {
                console.log('Checking authentication state on mount...');

                // Get comprehensive auth state
                const authState = await getAuthState();
                console.log('Auth state:', authState, 'Wallet state:', {isConnected, connectedAddress});

                // Handle different scenarios
                if (!authState.hasValidToken && !authState.hasRefreshToken) {
                    console.log('Scenario: No token -> normal flow');
                    setIsLoading(false);
                    return;
                }

                if (!authState.hasValidToken && authState.hasRefreshToken) {
                    console.log('Scenario: Expired token -> use refresh token to generate new token');
                    try {
                        const {bootstrapAuth} = await import('@/lib/auth');
                        const userData = await bootstrapAuth();
                        if (userData) {
                            console.log('Successfully refreshed tokens and got user data:', userData);
                            setUser(userData);
                            setAuthFlowState('completed');

                            // Persist user data
                            try {
                                const serializedData = serializeUserData(userData);
                                localStorage.setItem('txray_user', JSON.stringify(serializedData));
                            } catch (storageError) {
                                console.error('Error persisting refreshed user data:', storageError);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to refresh tokens:', error);
                        // Clear any stale data
                        localStorage.removeItem('txray_user');
                        localStorage.removeItem('txray_access_token');
                        localStorage.removeItem('txray_token_expiry');
                    }
                    setIsLoading(false);
                    return;
                }

                if (authState.hasValidToken) {
                    console.log('Scenario: Valid token - checking stored user data and wallet connection');

                    // Try to restore user data from localStorage
                    const storedUser = localStorage.getItem('txray_user');
                    if (storedUser) {
                        try {
                            const userData = JSON.parse(storedUser);
                            const deserializedUserData = deserializeUserData(userData);

                            if (deserializedUserData?.id && deserializedUserData?.wallet_address) {
                                console.log('Restored user from localStorage:', deserializedUserData);
                                setUser(deserializedUserData);
                                setAuthFlowState('completed');

                                // Auto-fetch contract data if not present
                                if (!deserializedUserData.contractData) {
                                    console.log('User restored but missing contract data, will fetch after wallet connection');
                                }

                                // Note: Wallet connection state will be handled by the wallet monitoring effect
                                setIsLoading(false);
                                return;
                            }
                        } catch (parseError) {
                            console.error('Error parsing stored user data:', parseError);
                        }
                    }

                    // If no valid stored data, try to get fresh user data from token
                    try {
                        const {getWalletAddressFromToken} = await import('@/lib/auth');
                        const tokenWalletAddress = await getWalletAddressFromToken();
                        if (tokenWalletAddress) {
                            // Create minimal user object from token
                            const tokenUser = {
                                id: 'token-user', // Temporary ID
                                wallet_address: tokenWalletAddress
                            };

                            console.log('Created user from token:', tokenUser);
                            setUser(tokenUser);
                            setAuthFlowState('completed');

                            // Try to get more complete user data via bootstrap
                            try {
                                const {bootstrapAuth} = await import('@/lib/auth');
                                const completeUserData = await bootstrapAuth();
                                if (completeUserData) {
                                    console.log('Got complete user data via bootstrap:', completeUserData);
                                    setUser(completeUserData);

                                    // Persist complete user data
                                    try {
                                        const serializedData = serializeUserData(completeUserData);
                                        localStorage.setItem('txray_user', JSON.stringify(serializedData));
                                    } catch (storageError) {
                                        console.error('Error persisting complete user data:', storageError);
                                    }
                                }
                            } catch (bootstrapError) {
                                console.warn('Could not get complete user data via bootstrap:', bootstrapError);
                            }
                        }
                    } catch (error) {
                        console.error('Error getting wallet address from token:', error);
                    }
                }

                // Fallback to Supabase session check (for backward compatibility)
                try {
                    const {data: {session}} = await supabase.auth.getSession();
                    if (session?.user) {
                        console.log('Found Supabase session, using as fallback');
                        setUser(session.user as AuthUser);
                        setAuthFlowState('completed');
                    }
                } catch (supabaseError) {
                    console.warn('Supabase session check failed:', supabaseError);
                }

            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes (Supabase)
        const {data: {subscription}} = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Supabase auth state change:', event, session?.user?.id);
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user as AuthUser);
                    setAuthFlowState('completed');
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setAuthFlowState('idle');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [setUser, setAuthFlowState, setIsLoading]);

    // Handle wallet connection changes after initial session check
    useEffect(() => {
        const handleWalletConnectionChange = async () => {
            if (isLoading) return; // Skip if still loading initial session

            try {
                const authState = await getAuthState();
                console.log('Wallet connection changed, checking auth state:', {
                    isConnected,
                    connectedAddress,
                    hasValidToken: authState.hasValidToken,
                    tokenWalletAddress: authState.tokenWalletAddress
                });

                // If we have a valid token and wallet is connected with matching address, ensure user is set
                if (authState.hasValidToken && isConnected && connectedAddress && authState.tokenWalletAddress) {
                    if (connectedAddress.toLowerCase() === authState.tokenWalletAddress.toLowerCase()) {
                        // Try to restore user data if not already set
                        const storedUser = localStorage.getItem('txray_user');
                        if (storedUser) {
                            try {
                                const userData = JSON.parse(storedUser);
                                const deserializedUserData = deserializeUserData(userData);
                                if (deserializedUserData?.id && deserializedUserData?.wallet_address) {
                                    console.log('Restoring user data after wallet connection:', deserializedUserData);
                                    setUser(deserializedUserData);
                                    setAuthFlowState('completed');
                                }
                            } catch (parseError) {
                                console.error('Error parsing stored user data after wallet connection:', parseError);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling wallet connection change:', error);
            }
        };

        handleWalletConnectionChange();
    }, [isConnected, connectedAddress, isLoading, setUser, setAuthFlowState]);
};
