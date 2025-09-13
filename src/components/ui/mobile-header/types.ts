import * as React from "react";

export interface MobileHeaderProps extends React.HTMLAttributes<HTMLElement> {
    logo?: React.ReactNode;
    brandName?: string;
    navigationItems?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
        isActive?: boolean;
    }>;
    walletButtonText?: string;
    onWalletConnect?: () => void;
    onAuthenticated?: (address: string) => void;
    onLogout?: () => void;
    onProfileClick?: () => void;
    onLogoClick?: () => void;
    user?: {
        address?: string;
        username?: string | null;
    } | null;
    activeNavigation?: string;
    onNavigationChange?: (page: string) => void;
    authFlowState?: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed';
    onResetAuthFlow?: () => void;
    onStartConnectionAttempt?: () => void;
    isMenuOpen?: boolean;
    onMenuToggle?: () => void;
    needsWalletConnection?: boolean;
}
