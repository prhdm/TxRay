import React, {useCallback} from 'react';
import {AuthState, NetworkSwitchState} from '../types';

export const useAppHandlers = (
    authState: AuthState,
    networkState: NetworkSwitchState,
    setShowNetworkModal: (show: boolean) => void,
    setCurrentPage: (page: any) => void,
    resetAuthFlow: () => void,
    lastAuthAttemptRef: React.RefObject<number>,
    authInProgressRef: React.RefObject<boolean>
) => {
    const handleWalletConnect = useCallback(() => {
        console.log("Wallet connect button clicked");
        // RainbowKit will handle the actual connection via the custom button
    }, []);

    const handleNetworkSwitch = useCallback(async () => {
        try {
            setShowNetworkModal(false);
            const result = await networkState.switchToCorrectNetwork();
            if (!result.success) {
                resetAuthFlow()
            }
        } catch (error) {
            console.error("Network switch error:", error);
            resetAuthFlow();
        }
    }, [networkState, setShowNetworkModal, resetAuthFlow]);

    const handleAuthenticated = useCallback(async (address: string) => {
        const now = Date.now();

        if (authInProgressRef.current) {
            return;
        }
        if (now - lastAuthAttemptRef.current < 3000) {
            return;
        }
        if (authState.user && authState.user.wallet_address === address) {
            authInProgressRef.current = false;
            return;
        }

        // Check if wallet is actually connected before attempting authentication
        if (!address) {
            console.log('No wallet address provided, skipping authentication');
            return;
        }

        if (!networkState.isCorrectNetwork) {
            setShowNetworkModal(true);
            return;
        }

        authInProgressRef.current = true;
        lastAuthAttemptRef.current = now;

        try {
            console.log('Attempting authentication for address:', address);
            await authState.authenticate(address);
        } catch (error) {
            console.error('Authentication error in handleAuthenticated:', error);
        } finally {
            authInProgressRef.current = false;
        }
    }, [authState, networkState, setShowNetworkModal, lastAuthAttemptRef, authInProgressRef]);

    const handleLogout = useCallback(async () => {
        await authState.signOut();
    }, [authState]);

    const handleProfileClick = useCallback(() => {
        setCurrentPage('profile');
    }, [setCurrentPage]);

    const handleLogoClick = useCallback(() => {
        setCurrentPage('inventory');
    }, [setCurrentPage]);

    return {
        handleWalletConnect,
        handleNetworkSwitch,
        handleAuthenticated,
        handleLogout,
        handleProfileClick,
        handleLogoClick,
    };
};
