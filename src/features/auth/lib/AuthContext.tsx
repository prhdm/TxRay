'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWalletAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: {
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    role?: string;
    contractData?: {
      balances: Record<number, bigint>;
      mintCount: bigint;
      currentPhase: number;
    } | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authFlowState: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed';
  authenticate: (address: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetAuthFlow: () => void;
  startConnectionAttempt: () => void;
  updateUser: (userData: Partial<{
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    role?: string;
    contractData?: {
      balances: Record<number, bigint>;
      mintCount: bigint;
      currentPhase: number;
    } | null;
  }>) => void;
  refreshContractData: () => Promise<void>;
  fetchContractData: () => Promise<void>;
}

/**
 * Authentication Flow:
 * 
 * 1. User connects wallet → authenticate() is called
 * 2. SIWE authentication completes → user is set (without contract data)
 * 3. Call fetchContractData() to get smart contract data
 * 4. Contract data is added to user object
 * 
 * Usage:
 * ```typescript
 * const { user, isAuthenticated, fetchContractData } = useAuth();
 * 
 * // After authentication is complete
 * if (isAuthenticated && !user?.contractData) {
 *   fetchContractData();
 * }
 * ```
 */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    role?: string;
    contractData?: {
      balances: Record<number, bigint>;
      mintCount: bigint;
      currentPhase: number;
    } | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authFlowState, setAuthFlowState] = useState<'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed'>('idle');
  
  // Use wallet auth functions directly since we're in SPA mode
  const { authenticate: walletAuthenticate, switchToTaikoHekla, silentReconnect } = useWalletAuth();

  const isAuthenticated = !!(user && user.id && user.wallet_address && authFlowState === 'completed');
  
  // Debug logging for authentication state
  console.log('AuthContext state:', { 
    hasUser: !!user, 
    userId: user?.id, 
    userAddress: user?.wallet_address, 
    authFlowState, 
    isAuthenticated 
  });

  const resetAuthFlow = useCallback(() => {
    console.log('AuthContext: resetAuthFlow called, current state:', authFlowState);
    setAuthFlowState('idle');
    console.log('AuthContext: authFlowState set to idle');
  }, [authFlowState]);

  const startConnectionAttempt = useCallback(() => {
    console.log('AuthContext: startConnectionAttempt called, setting state to connecting');
    setAuthFlowState('connecting');
  }, []);

  // Utility function to safely serialize user data for localStorage
  const serializeUserData = useCallback((userData: any) => {
    if (!userData) return userData;
    
    // Convert BigInt values to strings for JSON serialization
    const serialized = JSON.parse(JSON.stringify(userData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }));
    
    return serialized;
  }, []);

  // Utility function to deserialize user data from localStorage
  const deserializeUserData = useCallback((userData: any) => {
    if (!userData) return userData;
    
    // Convert string values back to BigInt where needed
    if (userData.contractData) {
      const { balances, mintCount, ...rest } = userData.contractData;
      
      // Convert balance strings back to BigInt
      const deserializedBalances: Record<number, bigint> = {};
      if (balances) {
        Object.entries(balances).forEach(([key, value]) => {
          deserializedBalances[Number(key)] = BigInt(value as string);
        });
      }
      
      return {
        ...userData,
        contractData: {
          ...rest,
          balances: deserializedBalances,
          mintCount: mintCount ? BigInt(mintCount as string) : 0n,
        }
      };
    }
    
    return userData;
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check localStorage for persisted user data
        const storedUser = localStorage.getItem('txray_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            const deserializedUserData = deserializeUserData(userData);
            console.log('Restoring user from localStorage:', deserializedUserData);
            setUser(deserializedUserData);
            setIsLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('txray_user');
          }
        }

        // Fallback to Supabase session check
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const authenticate = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthFlowState('network_check');
      setIsLoading(true);

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
        return { success: true };
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
        
        const switchResult = await switchToTaikoHekla();
        if (!switchResult.success) {
          console.error('Chain switch failed:', switchResult.error);
          setAuthFlowState('idle');
          return { success: false, error: switchResult.error || 'Failed to switch network' };
        }

        // Wait a moment for the chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now try authentication again
        console.log('Chain switched successfully, retrying authentication');
        setAuthFlowState('signing');
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
          return { success: true };
        } else {
          console.error('Authentication failed after chain switch:', retryResult.error);
          setAuthFlowState('idle');
          return { success: false, error: retryResult.error || 'Authentication failed after network switch' };
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
        return { success: true };
      } else {
        console.error('Authentication failed or incomplete user data:', result.error, result.user);
        setAuthFlowState('idle');
        return { success: false, error: result.error || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthFlowState('idle');
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [walletAuthenticate, switchToTaikoHekla, silentReconnect]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clear Supabase session
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.error('Supabase sign out error:', supabaseError);
      }

      // Clear local user state
      setUser(null);

      // Clear persisted user data
      localStorage.removeItem('txray_user');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();

      // Reset auth flow state
      setAuthFlowState('idle');

      // Clear auth tokens from auth.ts
      const { logout: authLogout } = await import('@/lib/auth');
      await authLogout();

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<{
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    contractData?: {
      balances: Record<number, bigint>;
      mintCount: bigint;
      currentPhase: number;
    } | null;
  }>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null);
  }, []);

  const fetchContractData = useCallback(async () => {
    // Only fetch contract data if user is fully authenticated
    if (!isAuthenticated || !user?.wallet_address) {
      console.error('User not fully authenticated, cannot fetch contract data');
      return;
    }

    if (user.contractData) {
      console.log('Contract data already exists, skipping fetch');
      return;
    }

    try {
      console.log('Fetching contract data for fully authenticated user:', user.wallet_address);
      const { fetchUserContractData } = await import('@/lib/auth');
      const contractData = await fetchUserContractData(user.wallet_address);
      
      if (contractData) {
        setUser(prevUser => prevUser ? { ...prevUser, contractData } : null);
        
        // Update localStorage
        try {
          const updatedUser = { ...user, contractData };
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
  }, [user, isAuthenticated, serializeUserData]);

  const refreshContractData = useCallback(async () => {
    // Only refresh contract data if user is fully authenticated
    if (!isAuthenticated || !user?.wallet_address) {
      console.error('User not fully authenticated, cannot refresh contract data');
      return;
    }

    try {
      const { refreshUserContractData } = await import('@/lib/auth');
      const contractData = await refreshUserContractData();
      
      if (contractData) {
        setUser(prevUser => prevUser ? { ...prevUser, contractData } : null);
        
        // Update localStorage
        try {
          const updatedUser = { ...user, contractData };
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
  }, [user, isAuthenticated, serializeUserData]);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    authFlowState,
    authenticate,
    signOut,
    resetAuthFlow,
    startConnectionAttempt,
    updateUser,
    fetchContractData,
    refreshContractData,
  }), [user, isAuthenticated, isLoading, authFlowState, authenticate, signOut, resetAuthFlow, startConnectionAttempt, updateUser, fetchContractData, refreshContractData]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In SPA mode, always render AuthProviderInner directly
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

 export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
