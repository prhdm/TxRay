import {useCallback} from 'react';
import {AuthFlowState, AuthUser} from '../types';
import {supabase} from '@/lib/supabase';
import {authToasts} from '@/lib/toast';

/**
 * Hook for handling sign out functionality
 */
export const useSignOut = (
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
    setAuthFlowState: React.Dispatch<React.SetStateAction<AuthFlowState>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const signOut = useCallback(async () => {
        try {
            setIsLoading(true);

            // Clear Supabase session
            const {error: supabaseError} = await supabase.auth.signOut();
            if (supabaseError) {
                console.error('Supabase sign out error:', supabaseError);
            }

            // Clear local user state
            setUser(null);
            authToasts.logout();

            // Clear persisted user data
            localStorage.removeItem('txray_user');
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();

            // Reset auth flow state
            setAuthFlowState('idle');

            // Clear auth tokens from auth.ts
            const {logout: authLogout} = await import('@/lib/auth');
            await authLogout();

            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [setUser, setAuthFlowState, setIsLoading]);

    return {signOut};
};
