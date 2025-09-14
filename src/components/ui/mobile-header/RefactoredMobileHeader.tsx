"use client";

import * as React from "react";
import {useAccountModal, useConnectModal} from '@rainbow-me/rainbowkit';
import {useAccount, useDisconnect} from 'wagmi';
import {X} from 'lucide-react';
import {Logo} from '../logo';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '../dialog';
import {Button} from '../button';

// Import refactored components
import {MobileHeaderProps} from './types';
import {MobileMenuHeader} from './MobileMenuHeader';
import {MobileAccountSection} from './MobileAccountSection';
import {MobileNavigation} from './MobileNavigation';

/**
 * Refactored Mobile Header
 *
 * This component has been broken down into smaller, focused components:
 * - MobileMenuHeader: The main header with logo and menu toggle
 * - MobileAccountSection: User account display and wallet connection
 * - MobileNavigation: Navigation menu items and logout
 *
 * Each component handles a specific aspect of the mobile header functionality.
 */

const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
    ({
         className,
         logo,
         brandName = "logoipsum",
         navigationItems = [
             {label: "Inventory"},
             {label: "Analytics"}
         ],
         walletButtonText = "Connect your wallet",
         onWalletConnect,
         onAuthenticated,
         onLogout,
         onProfileClick,
         onLogoClick,
         user,
         activeNavigation,
         onNavigationChange,
         authFlowState = 'idle',
         onResetAuthFlow,
         onStartConnectionAttempt,
         isMenuOpen = false,
         onMenuToggle,
         needsWalletConnection = false,
         ...props
     }, ref) => {
        const {openConnectModal, connectModalOpen} = useConnectModal();
        const {openAccountModal} = useAccountModal();
        const {address, isConnected} = useAccount();
        const {disconnect} = useDisconnect();
        const [waitingForDisconnect, setWaitingForDisconnect] = React.useState(false);
        const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

        // Same authentication logic as the original component
        React.useEffect(() => {
            if (user && user.address === address) {
                return;
            }

            if (isConnected && address && onAuthenticated && authFlowState === 'connecting') {
                const timeoutId = setTimeout(() => {
                    onAuthenticated(address);
                }, 300);
                return () => clearTimeout(timeoutId);
            }

            if (isConnected && address && !user && authFlowState === 'idle') {
                // Wallet connected but user not authenticated and flow is idle
            }
        }, [isConnected, address, onAuthenticated, authFlowState, onStartConnectionAttempt, user]);

        React.useEffect(() => {
            if (waitingForDisconnect && !isConnected && !address) {
                setWaitingForDisconnect(false);
                openConnectModal?.();
                onWalletConnect?.();
            }
        }, [waitingForDisconnect, isConnected, address, openConnectModal, onWalletConnect]);

        React.useEffect(() => {
            if (waitingForDisconnect) {
                const timeout = setTimeout(() => {
                    setWaitingForDisconnect(false);
                }, 5000);
                return () => clearTimeout(timeout);
            }
        }, [waitingForDisconnect]);

        React.useEffect(() => {
            if (!isConnected && !address && authFlowState !== 'idle' && onResetAuthFlow) {
                if (authFlowState !== 'connecting') {
                    onResetAuthFlow();
                }
            }
        }, [isConnected, address, authFlowState, onResetAuthFlow]);

        const handleConnectClick = () => {
            // If user is authenticated but needs wallet connection, just open connect modal (skip auth)
            if (needsWalletConnection) {
                openConnectModal?.();
                onWalletConnect?.();
                return;
            }

            if (onStartConnectionAttempt) {
                onStartConnectionAttempt();
            }

            if (isConnected && !user) {
                setWaitingForDisconnect(true);
                disconnect();
            } else if (isConnected && user) {
                // User already authenticated
            } else {
                openConnectModal?.();
                onWalletConnect?.();
            }
        };

        const handleLogoutClick = () => {
            setShowLogoutDialog(true);
            onMenuToggle?.(); // Close menu when showing dialog
        };

        const handleLogoutConfirm = async () => {
            setShowLogoutDialog(false);
            if (onLogout) {
                await onLogout();
            }
        };

        const handleLogoutCancel = () => {
            setShowLogoutDialog(false);
        };

        return (
            <>
                {/* Main Header */}
                <MobileMenuHeader
                    ref={ref}
                    logo={logo}
                    onLogoClick={onLogoClick}
                    isMenuOpen={isMenuOpen}
                    onMenuToggle={onMenuToggle}
                    className={className}
                    {...props}
                />

                {/* Mobile Side Menu */}
                {isMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 animate-in fade-in duration-300"
                            onClick={onMenuToggle}
                        />

                        {/* Side Menu */}
                        <div
                            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
                            <div className="flex flex-col h-full">
                                {/* Menu Header */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-background to-gray-50">
                                    <div className="flex items-center">
                                        {logo || <Logo size="md"/>}
                                    </div>
                                    <button
                                        onClick={onMenuToggle}
                                        className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                                        aria-label="Close menu"
                                    >
                                        <X className="h-5 w-5 text-foreground"/>
                                    </button>
                                </div>

                                {/* Account Section */}
                                <MobileAccountSection
                                    user={user}
                                    needsWalletConnection={needsWalletConnection}
                                    connectModalOpen={connectModalOpen}
                                    authFlowState={authFlowState}
                                    waitingForDisconnect={waitingForDisconnect}
                                    onConnectClick={handleConnectClick}
                                />

                                {/* Navigation */}
                                <MobileNavigation
                                    user={user}
                                    navigationItems={navigationItems}
                                    activeNavigation={activeNavigation}
                                    onNavigationChange={onNavigationChange}
                                    onProfileClick={onProfileClick}
                                    onMenuToggle={onMenuToggle}
                                    onLogoutClick={handleLogoutClick}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Confirmation Dialog */}
                <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <DialogContent className="sm:max-w-[425px] bg-[#F3F3F3] border-[#191A23]">
                        <DialogHeader>
                            <DialogTitle className="text-[#191A23]">Confirm Logout</DialogTitle>
                            <DialogDescription className="text-[#191A23]/80">
                                Are you sure you want to logout? You will need to reconnect your wallet to access your
                                account again.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-3">
                            <Button
                                variant="outline"
                                onClick={handleLogoutCancel}
                                className="flex-1 border-[#191A23] text-[#191A23] hover:bg-[#191A23] hover:text-white shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleLogoutConfirm}
                                className="flex-1 bg-[#191A23] text-white hover:bg-[#191A23]/90 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Logout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

MobileHeader.displayName = "MobileHeader";

export {MobileHeader};
