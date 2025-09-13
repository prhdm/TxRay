import React from "react";

export interface AuthenticationHandlers {
    handleWalletConnect: () => void;
    handleNetworkSwitch: () => Promise<void>;
    handleAuthenticated: (address: string) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleProfileClick: () => void;
    handleLogoClick: () => void;
}

export interface AppState {
    showNetworkModal: boolean;
    isMobileMenuOpen: boolean;
    lastAuthAttemptRef: React.MutableRefObject<number>;
    authInProgressRef: React.MutableRefObject<boolean>;
}

export interface NetworkSwitchState {
    switchToCorrectNetwork: () => Promise<{ success: boolean; error?: string }>;
    isCorrectNetwork: boolean;
    isSwitching: boolean;
    targetChainName: string;
}

export interface AuthState {
    authenticate: (address: string) => Promise<{ success: boolean; error?: string }>;
    user: any;
    signOut: () => Promise<void>;
    authFlowState: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed';
    resetAuthFlow: () => void;
    startConnectionAttempt: () => void;
    needsWalletConnection: boolean;
}
