"use client";

import React from "react";
import {NavigationProvider, useNavigation} from "@/features/navigation/lib/NavigationContext";
import {useAuth} from "@/features/auth/lib/AuthContext";
import {useNetworkSwitch} from "@/hooks/useNetworkSwitch";

import {useAppState} from './hooks/useAppState';
import {useAppHandlers} from './hooks/useAppHandlers';
import {NetworkSwitchModal} from './components/NetworkSwitchModal';
import {PageRenderer} from './components/PageRenderer';
import {AppLayout} from './components/AppLayout';

function AppContent() {
    const {currentPage, setCurrentPage} = useNavigation();
    const authState = useAuth();
    const networkState = useNetworkSwitch();

    const appState = useAppState();

    const handlers = useAppHandlers(
        authState,
        networkState,
        appState.setShowNetworkModal,
        setCurrentPage,
        authState.resetAuthFlow,
        appState.lastAuthAttemptRef,
        appState.authInProgressRef
    );

    return (
        <>
            <AppLayout
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                handlers={handlers}
                authState={authState}
                isMobileMenuOpen={appState.isMobileMenuOpen}
                setIsMobileMenuOpen={appState.setIsMobileMenuOpen}
            >
                <PageRenderer currentPage={currentPage}/>
            </AppLayout>

            <NetworkSwitchModal
                isOpen={appState.showNetworkModal}
                onClose={() => appState.setShowNetworkModal(false)}
                onSwitch={handlers.handleNetworkSwitch}
                targetChainName={networkState.targetChainName}
                isSwitching={networkState.isSwitching}
            />
        </>
    );
}

export default function Txray() {
    return (
        <NavigationProvider>
            <AppContent/>
        </NavigationProvider>
    );
}
