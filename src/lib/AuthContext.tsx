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
  }>) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    role?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authFlowState, setAuthFlowState] = useState<'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed'>('idle');
  
  // Use wallet auth functions directly since we're in SPA mode
  const { authenticate: walletAuthenticate, silentReconnect } = useWalletAuth();

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const resetAuthFlow = useCallback(() => {
    console.log('AuthContext: resetAuthFlow called, current state:', authFlowState);
    setAuthFlowState('idle');
    console.log('AuthContext: authFlowState set to idle');
  }, []);

  const startConnectionAttempt = useCallback(() => {
    console.log('AuthContext: startConnectionAttempt called, setting state to connecting');
    setAuthFlowState('connecting');
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
            console.log('Restoring user from localStorage:', userData);
            setUser(userData);
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
      setAuthFlowState('authenticating');
      setIsLoading(true);

      // First try silent reconnection
      console.log('Attempting silent reconnection for address:', address);
      const silentResult = await silentReconnect(address);

      if (silentResult.success) {
        console.log('Silent reconnection successful, proceeding with wallet connection');

        // If silent reconnection succeeds, we still need to get the actual user data
        // Try to bootstrap to get the real user data
        try {
          const bootstrapResult = await import('@/lib/auth').then(m => m.bootstrapAuth());
          if (bootstrapResult) {
            console.log('Bootstrap successful, user data retrieved:', bootstrapResult);
            setAuthFlowState('completed');
            setUser(bootstrapResult);

            // Persist user data to localStorage
            try {
              localStorage.setItem('txray_user', JSON.stringify(bootstrapResult));
              console.log('User data persisted to localStorage');
            } catch (storageError) {
              console.error('Error persisting user data:', storageError);
            }

            console.log('User state updated via silent reconnection');
            return { success: true };
          }
        } catch (bootstrapError) {
          console.error('Bootstrap failed after silent reconnection:', bootstrapError);
        }
      }

      // If silent reconnection failed or bootstrap didn't work, proceed with full SIWE
      console.log('Silent reconnection failed or incomplete, proceeding with full SIWE authentication');
      const result = await walletAuthenticate(address);

      if (result.success && result.user) {
        console.log('Full SIWE authentication successful:', result.user);
        setAuthFlowState('completed');
        // Set user directly since we're not using Supabase sessions
        setUser(result.user);

        // Persist user data to localStorage
        try {
          localStorage.setItem('txray_user', JSON.stringify(result.user));
          console.log('User data persisted to localStorage');
        } catch (storageError) {
          console.error('Error persisting user data:', storageError);
        }

        console.log('User state updated, isAuthenticated should now be:', !!result.user);
        return { success: true };
      } else {
        console.error('Authentication failed:', result.error);
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
  }, [walletAuthenticate, silentReconnect]);

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
  }>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null);
  }, []);

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
    isAdmin,
  }), [user, isAuthenticated, isLoading, authFlowState, authenticate, signOut, resetAuthFlow, startConnectionAttempt, updateUser, isAdmin]);

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
