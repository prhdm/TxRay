import {useCallback} from 'react';
import {AuthFlowState, AuthUser} from '../types';
import {useWalletAuth} from '@/lib/auth';
import {authToasts} from '@/lib/toast';

export const useAuthentication = (
    setAuthFlowState: (state: AuthFlowState) => void,
    setIsLoading: (loading: boolean) => void,
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>
) => {
    const {authenticate} = useWalletAuth();

    const authenticateUser = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setAuthFlowState('authenticating');
            setIsLoading(true);

            const result = await authenticate(address);

            if (result.success && result.user) {
                setUser(result.user);
                setAuthFlowState('completed');
                authToasts.authenticated();
                return { success: true };
            } else {
                // Check if this is a user cancellation
                const isUserCancellation = result.error && (
                    result.error.includes('User cancelled') ||
                    result.error.includes('User rejected') ||
                    result.error.includes('User denied') ||
                    result.error.includes('rejected') ||
                    result.error.includes('denied') ||
                    result.error.includes('cancelled') ||
                    result.error.includes('canceled') ||
                    result.error.includes('4001') ||
                    result.error.includes('ACTION_REJECTED')
                );

                if (isUserCancellation) {
                    // User cancelled - don't show error toast, just reset state
                    setAuthFlowState('idle');
                    return { success: false, error: 'User cancelled authentication' };
                } else {
                    // Real error - show toast
                    authToasts.authError(result.error || 'Authentication failed');
                    setAuthFlowState('idle');
                    return { success: false, error: result.error };
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            
            // Check if this is a user cancellation
            const isUserCancellation = errorMessage.includes('User cancelled') ||
                errorMessage.includes('User rejected') ||
                errorMessage.includes('User denied') ||
                errorMessage.includes('rejected') ||
                errorMessage.includes('denied') ||
                errorMessage.includes('cancelled') ||
                errorMessage.includes('canceled') ||
                errorMessage.includes('4001') ||
                errorMessage.includes('ACTION_REJECTED');

            if (isUserCancellation) {
                // User cancelled - don't show error toast, just reset state
                setAuthFlowState('idle');
                return { success: false, error: 'User cancelled authentication' };
            } else {
                // Real error - show toast
                authToasts.authError(errorMessage);
                setAuthFlowState('idle');
                return { success: false, error: errorMessage };
            }
        } finally {
            setIsLoading(false);
        }
    }, [authenticate, setAuthFlowState, setIsLoading, setUser]);

    return {
        authenticate: authenticateUser,
    };
};
