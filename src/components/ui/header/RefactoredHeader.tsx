import * as React from "react"
import {cn} from "../lib/utils"
import {useAccountModal, useConnectModal} from '@rainbow-me/rainbowkit'
import {useAccount, useDisconnect} from 'wagmi'
import {ProfileDropdown} from '../profile-dropdown'

// Import refactored components
import {HeaderProps} from './types'
import {HeaderLogo} from './HeaderLogo'
import {HeaderNavigation} from './HeaderNavigation'
import {ConnectButton} from './ConnectButton'

/**
 * Refactored Header Component
 *
 * This component has been broken down into smaller, focused components:
 * - HeaderLogo: Logo and brand section
 * - HeaderNavigation: Navigation menu items
 * - ConnectButton: Wallet connection button with states
 *
 * The main header component orchestrates these components and manages state.
 */

const Header = React.forwardRef<HTMLElement, HeaderProps>(
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
         needsWalletConnection = false,
         ...props
     }, ref) => {
        const {openConnectModal, connectModalOpen} = useConnectModal();
        const {openAccountModal} = useAccountModal();
        const {address, isConnected} = useAccount();
        const {disconnect} = useDisconnect();
        const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
        const [waitingForDisconnect, setWaitingForDisconnect] = React.useState(false);

        console.log('Header render - user:', user, 'authFlowState:', authFlowState, 'isConnected:', isConnected, 'address:', address, 'connectModalOpen:', connectModalOpen);

        // Trigger authentication when wallet connects (only if we initiated the connection)
        React.useEffect(() => {
            console.log('Header useEffect check:', {
                isConnected,
                address,
                authFlowState,
                hasOnAuthenticated: !!onAuthenticated,
                hasOnStartConnectionAttempt: !!onStartConnectionAttempt,
                hasUser: !!user
            });

            // If user is already authenticated, don't trigger auth again
            if (user && user.address === address) {
                console.log('User already authenticated with this address, skipping auth trigger');
                return;
            }

            // Only trigger authentication if we're in connecting state and have the necessary callbacks
            if (isConnected && address && onAuthenticated && authFlowState === 'connecting') {
                console.log('Wallet connected successfully, will trigger authentication in 1 second');
                // Add a longer delay to ensure wallet is fully ready for signing
                const timeoutId = setTimeout(() => {
                    // Double-check that wallet is still connected before triggering auth
                    if (isConnected && address) {
                        console.log('Triggering authentication for address:', address);
                        onAuthenticated(address);
                    } else {
                        console.log('Wallet disconnected during timeout, skipping authentication');
                    }
                }, 1000); // Increased delay to 1 second

                return () => clearTimeout(timeoutId);
            }

            // If wallet is connected but user is not authenticated and we're not in connecting state,
            // this might be a leftover connection from before logout - don't auto-trigger auth
            if (isConnected && address && !user && authFlowState === 'idle') {
                console.log('Wallet connected but user not authenticated and flow is idle - waiting for user to click connect');
            }
        }, [isConnected, address, onAuthenticated, authFlowState, onStartConnectionAttempt, user]);

        // Handle opening connect modal after disconnect completes
        React.useEffect(() => {
            if (waitingForDisconnect && !isConnected && !address) {
                console.log('Disconnect completed, opening connect modal');
                setWaitingForDisconnect(false);
                openConnectModal?.();
                onWalletConnect?.();
            }
        }, [waitingForDisconnect, isConnected, address, openConnectModal, onWalletConnect]);

        // Timeout to reset waitingForDisconnect state if disconnect takes too long
        React.useEffect(() => {
            if (waitingForDisconnect) {
                const timeout = setTimeout(() => {
                    console.log('Disconnect timeout, resetting state');
                    setWaitingForDisconnect(false);
                }, 5000); // 5 second timeout

                return () => clearTimeout(timeout);
            }
        }, [waitingForDisconnect]);

        // Reset flow if user disconnects wallet during the process (but not during intentional disconnect)
        React.useEffect(() => {
            if (!isConnected && !address && authFlowState !== 'idle' && onResetAuthFlow) {
                console.log('Wallet disconnected during flow, resetting...');
                // Only reset if we're not in the middle of a connection attempt
                if (authFlowState !== 'connecting') {
                    onResetAuthFlow();
                }
            }
        }, [isConnected, address, authFlowState, onResetAuthFlow]);

        // Track modal state to detect when it closes without connecting
        const [wasModalOpen, setWasModalOpen] = React.useState(false);
        const [modalCloseTimeout, setModalCloseTimeout] = React.useState<NodeJS.Timeout | null>(null);

        React.useEffect(() => {
            console.log('Modal state effect:', {connectModalOpen, wasModalOpen, authFlowState, isConnected, address});

            if (connectModalOpen) {
                console.log('Modal opened, setting wasModalOpen to true');
                setWasModalOpen(true);
                // Clear any existing timeout when modal opens
                if (modalCloseTimeout) {
                    clearTimeout(modalCloseTimeout);
                    setModalCloseTimeout(null);
                }
            } else if (wasModalOpen && !connectModalOpen) {
                // Modal was open and is now closed
                console.log('Modal closed, wasModalOpen was true');
                setWasModalOpen(false);

                // Only reset if we're still in connecting state and no wallet is connected
                if (authFlowState === 'connecting' && !isConnected && !address && onResetAuthFlow) {
                    console.log('Modal closed without connecting, will reset in 500ms');
                    const timeoutId = setTimeout(() => {
                        // Final check before resetting
                        if (authFlowState === 'connecting' && !isConnected && !address) {
                            console.log('Resetting auth flow after modal close');
                            onResetAuthFlow();
                        } else {
                            console.log('Auth state changed during timeout, not resetting:', {
                                authFlowState,
                                isConnected,
                                address
                            });
                        }
                        setModalCloseTimeout(null);
                    }, 500); // Reduced timeout for faster response

                    setModalCloseTimeout(timeoutId);
                } else {
                    console.log('Not resetting because conditions not met:', {
                        authFlowState,
                        isConnected,
                        address,
                        hasOnResetAuthFlow: !!onResetAuthFlow
                    });
                }
            }
        }, [connectModalOpen, wasModalOpen, authFlowState, isConnected, address, onResetAuthFlow, modalCloseTimeout]);

        // Cleanup timeout on unmount
        React.useEffect(() => {
            return () => {
                if (modalCloseTimeout) {
                    clearTimeout(modalCloseTimeout);
                }
            };
        }, [modalCloseTimeout]);

        // Fallback: Reset connecting state if stuck for too long
        React.useEffect(() => {
            if (authFlowState === 'connecting' && onResetAuthFlow) {
                console.log('Starting fallback timer for connecting state');
                const fallbackTimeout = setTimeout(() => {
                    if (authFlowState === 'connecting' && !isConnected && !address) {
                        console.log('Fallback: Resetting stuck connecting state');
                        onResetAuthFlow();
                    }
                }, 10000); // 10 second fallback

                return () => {
                    console.log('Clearing fallback timer');
                    clearTimeout(fallbackTimeout);
                };
            }
        }, [authFlowState, isConnected, address, onResetAuthFlow]);

        // Close dropdown when clicking outside
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (isProfileDropdownOpen) {
                    setIsProfileDropdownOpen(false);
                }
            };

            if (isProfileDropdownOpen) {
                document.addEventListener('click', handleClickOutside);
                return () => document.removeEventListener('click', handleClickOutside);
            }
        }, [isProfileDropdownOpen]);

        const handleConnectClick = () => {
            console.log('Connect button clicked, current state:', {
                isConnected,
                authFlowState,
                hasUser: !!user,
                needsWalletConnection
            });

            // If user is authenticated but needs wallet connection, just open connect modal (skip auth)
            if (needsWalletConnection) {
                console.log('User authenticated but needs wallet connection, opening connect modal (skipping auth)');
                openConnectModal?.();
                onWalletConnect?.();
                return;
            }

            // Always start with a fresh connection attempt for new users
            if (onStartConnectionAttempt) {
                console.log('Starting connection attempt');
                onStartConnectionAttempt();
            }

            // If wallet is already connected but user is not authenticated (after logout),
            // disconnect it first to force wallet selection
            if (isConnected && !user) {
                console.log('Wallet connected but user not authenticated (after logout), disconnecting first');
                setWaitingForDisconnect(true);
                disconnect();
                // The useEffect will handle opening the modal after disconnect completes
            } else if (isConnected && user) {
                // User is already authenticated, this shouldn't happen as button should be hidden
                console.log('User already authenticated, this should not happen');
            } else {
                // Wallet not connected, open connect modal
                console.log('Opening connect modal');
                openConnectModal?.();
                onWalletConnect?.();
            }
        };

        const isButtonDisabled = connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect;

        return (
            <header
                ref={ref}
                className={cn(
                    "flex items-center justify-between w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-8",
                    className
                )}
                {...props}
            >
                {/* Left side - Logo and Brand */}
                <HeaderLogo logo={logo} onLogoClick={onLogoClick}/>

                {/* Right side - Navigation and Wallet */}
                <div className="flex items-center space-x-6">
                    {/* Navigation Items */}
                    <HeaderNavigation
                        navigationItems={navigationItems}
                        activeNavigation={activeNavigation}
                        onNavigationChange={onNavigationChange}
                    />

                    {/* Profile Dropdown or Connect Button */}
                    {user && !needsWalletConnection ? (
                        <ProfileDropdown
                            userAddress={user.address}
                            userName={user.username || undefined}
                            isOpen={isProfileDropdownOpen}
                            onToggle={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            onProfileClick={() => {
                                setIsProfileDropdownOpen(false);
                                onProfileClick?.();
                            }}
                            onLogout={() => {
                                setIsProfileDropdownOpen(false);
                                onLogout?.();
                            }}
                        />
                    ) : (
                        <ConnectButton
                            walletButtonText={walletButtonText}
                            connectModalOpen={connectModalOpen}
                            authFlowState={authFlowState}
                            waitingForDisconnect={waitingForDisconnect}
                            disabled={isButtonDisabled}
                            onClick={handleConnectClick}
                        />
                    )}
                </div>
            </header>
        )
    }
)
Header.displayName = "Header"

export {Header}
