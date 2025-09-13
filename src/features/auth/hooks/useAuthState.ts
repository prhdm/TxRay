import {useCallback} from 'react';
import {AuthFlowState} from '../types';

/**
 * Hook for managing authentication flow state
 */
export const useAuthState = (
    setAuthFlowState: (state: AuthFlowState) => void
) => {
    const resetAuthFlow = useCallback(() => {
        console.log('AuthContext: resetAuthFlow called');
        setAuthFlowState('idle');
        console.log('AuthContext: authFlowState set to idle');
    }, [setAuthFlowState]);

    const startConnectionAttempt = useCallback(() => {
        console.log('AuthContext: startConnectionAttempt called, setting state to connecting');
        setAuthFlowState('connecting');
    }, [setAuthFlowState]);

    return {
        resetAuthFlow,
        startConnectionAttempt,
    };
};
