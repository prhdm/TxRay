import React from 'react';
import {Footer, Header, Logo, MobileHeader} from "@/ui";
import {NavigationPage} from "@/features/navigation/lib/NavigationContext";
import {AuthenticationHandlers, AuthState} from '../types';

interface AppLayoutProps {
    currentPage: NavigationPage;
    setCurrentPage: (page: NavigationPage) => void;
    handlers: AuthenticationHandlers;
    authState: AuthState;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
                                                        currentPage,
                                                        setCurrentPage,
                                                        handlers,
                                                        authState,
                                                        isMobileMenuOpen,
                                                        setIsMobileMenuOpen,
                                                        children,
                                                    }) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Desktop Header */}
            <div className="hidden lg:block">
                <Header
                    logo={<Logo size="lg"/>}
                    onWalletConnect={handlers.handleWalletConnect}
                    onAuthenticated={handlers.handleAuthenticated}
                    onLogout={handlers.handleLogout}
                    onProfileClick={handlers.handleProfileClick}
                    onLogoClick={handlers.handleLogoClick}
                    user={authState.user ? {
                        address: authState.user.wallet_address || '',
                        username: authState.user.username
                    } : null}
                    activeNavigation={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                    onNavigationChange={(page) => setCurrentPage(page.toLowerCase() as NavigationPage)}
                    authFlowState={authState.authFlowState}
                    onResetAuthFlow={authState.resetAuthFlow}
                    onStartConnectionAttempt={authState.startConnectionAttempt}
                    needsWalletConnection={authState.needsWalletConnection}
                />
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
                <MobileHeader
                    logo={<Logo size="lg"/>}
                    onWalletConnect={handlers.handleWalletConnect}
                    onAuthenticated={handlers.handleAuthenticated}
                    onLogout={handlers.handleLogout}
                    onProfileClick={handlers.handleProfileClick}
                    onLogoClick={handlers.handleLogoClick}
                    user={authState.user ? {
                        address: authState.user.wallet_address || '',
                        username: authState.user.username
                    } : null}
                    activeNavigation={currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                    onNavigationChange={(page) => setCurrentPage(page.toLowerCase() as NavigationPage)}
                    authFlowState={authState.authFlowState}
                    onResetAuthFlow={authState.resetAuthFlow}
                    onStartConnectionAttempt={authState.startConnectionAttempt}
                    isMenuOpen={isMobileMenuOpen}
                    onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    needsWalletConnection={authState.needsWalletConnection}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>

            {/* Footer */}
            <Footer/>
        </div>
    );
};
