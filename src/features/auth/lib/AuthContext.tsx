'use client';

import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {useAccount} from 'wagmi';

// Import types
import {AuthContextType, AuthFlowState, AuthUser} from '../types';

// Import hooks
import {useAuthState} from '../hooks/useAuthState';
import {useContractData} from '../hooks/useContractData';
import {useAuthSession} from '../hooks/useAuthSession';
import {useWalletMonitoring} from '../hooks/useWalletMonitoring';
import {useAuthentication} from '../hooks/useAuthentication';
import {useSignOut} from '../hooks/useSignOut';
import {useAutoFetchContractData} from '../hooks/useAutoFetchContractData';

/**
 * Refactored Authentication Context
 *
 * This context has been broken down into smaller, focused modules:
 * - types/: Type definitions
 * - utils/: Utility functions (serialization, etc.)
 * - hooks/: Specific functionality hooks
 *
 * Each hook handles a specific aspect of authentication:
 * - useAuthState: Flow state management
 * - useContractData: Contract data fetching and refreshing
 * - useAuthSession: Session restoration and monitoring
 * - useWalletMonitoring: Wallet connection scenarios
 * - useAuthentication: Main authentication flow
 * - useSignOut: Sign out functionality
 * - useAutoFetchContractData: Automatic contract data fetching
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({children}: { children: React.ReactNode }) {
    // State
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authFlowState, setAuthFlowState] = useState<AuthFlowState>('idle');

    // Monitor wallet connection
    const {address: connectedAddress, isConnected} = useAccount();

    // Computed values
    const isAuthenticated = !!(user && user.id && user.wallet_address && authFlowState === 'completed');

    // Check if user is authenticated but wallet is not connected OR connected to different wallet
    const needsWalletConnection = Boolean(isAuthenticated && (
        !isConnected ||
        !connectedAddress ||
        (connectedAddress && user?.wallet_address && connectedAddress.toLowerCase() !== user.wallet_address.toLowerCase())
    ));

    // Debug logging for authentication state
    console.log('AuthContext state:', {
        hasUser: !!user,
        userId: user?.id,
        userAddress: user?.wallet_address,
        authFlowState,
        isAuthenticated,
        isConnected,
        connectedAddress,
        isLoading,
        needsWalletConnection
    });

    // Initialize hooks
    const {resetAuthFlow, startConnectionAttempt} = useAuthState(setAuthFlowState);
    const {fetchContractData, refreshContractData} = useContractData(user, authFlowState, setUser);
    const {authenticate} = useAuthentication(setAuthFlowState, setIsLoading, setUser);
    const {signOut} = useSignOut(setUser, setAuthFlowState, setIsLoading);

    // User update function
    const updateUser = useCallback((userData: Partial<AuthUser>) => {
        setUser(prevUser => prevUser ? {...prevUser, ...userData} : null);
    }, []);

    // Initialize effects
    useAuthSession(setUser, setAuthFlowState, setIsLoading);
    useWalletMonitoring(
        user,
        isAuthenticated,
        authFlowState,
        isLoading,
        isConnected,
        connectedAddress,
        setUser,
        setAuthFlowState
    );
    useAutoFetchContractData(
        isAuthenticated,
        user,
        isConnected,
        connectedAddress,
        authFlowState,
        isLoading,
        fetchContractData
    );

    // Context value
    const value = useMemo(() => ({
        user,
        isAuthenticated,
        isLoading,
        authFlowState,
        needsWalletConnection,
        authenticate,
        signOut,
        resetAuthFlow,
        startConnectionAttempt,
        updateUser,
        fetchContractData,
        refreshContractData,
    }), [
        user,
        isLoading,
        authFlowState,
        needsWalletConnection,
        authenticate,
        signOut,
        resetAuthFlow,
        startConnectionAttempt,
        updateUser,
        fetchContractData,
        refreshContractData
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({children}: { children: React.ReactNode }) {
    return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
