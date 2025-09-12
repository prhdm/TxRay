"use client";

import * as React from "react";
import { cn } from "./lib/utils";
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { ProfileDropdown } from './profile-dropdown';
import { Menu, X } from 'lucide-react';
import { Logo } from './logo';

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
}

const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
  ({
    className,
    logo,
    brandName = "logoipsum",
    navigationItems = [
      { label: "Inventory" },
      { label: "Analytics" }
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
    ...props
  }, ref) => {
    const { openConnectModal, connectModalOpen } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
    const [waitingForDisconnect, setWaitingForDisconnect] = React.useState(false);

    // Same authentication logic as the desktop header
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

    const [wasModalOpen, setWasModalOpen] = React.useState(false);
    
    React.useEffect(() => {
      if (connectModalOpen) {
        setWasModalOpen(true);
      } else if (wasModalOpen && !connectModalOpen) {
        setWasModalOpen(false);
        
        if (authFlowState === 'connecting' && !isConnected && !address && onResetAuthFlow) {
          const timeoutId = setTimeout(() => {
            if (authFlowState === 'connecting' && !isConnected && !address) {
              onResetAuthFlow();
            }
          }, 1000);
          return () => clearTimeout(timeoutId);
        }
      }
    }, [connectModalOpen, wasModalOpen, authFlowState, isConnected, address, onResetAuthFlow]);

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

    return (
      <>
        <header
          ref={ref}
          className={cn(
            "flex items-center justify-between w-full px-4 py-4 bg-background border-b border-border shadow-sm",
            className
          )}
          {...props}
        >
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
              disabled={!onLogoClick}
            >
            {logo || <Logo size="md" />}
            </button>
          </div>

          {/* Right side - Menu button and Profile/Wallet */}
          <div className="flex items-center space-x-3">
            {/* Profile Dropdown or Connect Button */}
            {user ? (
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
              <button
                onClick={() => {
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
                }}
                disabled={connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect}
                className={cn(
                  "relative px-3 py-2 text-sm border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_2px_0_0_rgba(0,0,0,1)] hover:shadow-[0_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group",
                  (connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect) && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
                <span className="relative z-10">
                  {waitingForDisconnect ? 'Disconnecting...' :
                   connectModalOpen ? 'Connecting...' :
                   authFlowState === 'connecting' ? 'Connecting...' :
                   authFlowState === 'network_check' ? 'Checking...' :
                   authFlowState === 'network_switch' ? 'Switching...' :
                   authFlowState === 'signing' ? 'Signing...' :
                   authFlowState === 'authenticating' ? 'Auth...' :
                   'Connect'}
                </span>
              </button>
            )}

            {/* Hamburger Menu Button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring transform hover:scale-105"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-foreground animate-in fade-in duration-200" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground animate-in fade-in duration-200" />
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Side Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 animate-in fade-in duration-300"
              onClick={onMenuToggle}
            />
            
            {/* Side Menu */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-background to-gray-50">
                  <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
                  <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4">
                  <div className="space-y-1">
                    {navigationItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (onNavigationChange) {
                            onNavigationChange(item.label.toLowerCase());
                          }
                          if (item.onClick) {
                            item.onClick();
                          }
                          onMenuToggle?.(); // Close menu after navigation
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg text-foreground hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring transform hover:scale-[1.02]",
                          (activeNavigation === item.label || item.isActive) && "bg-[#B9FF66] text-black font-medium shadow-sm"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {item.label === 'Inventory' ? '📦' : 
                             item.label === 'Analytics' ? '📊' : 
                             item.label === 'Profile' ? '👤' : '📄'}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Menu Footer */}
                <div className="p-4 border-t border-border bg-gradient-to-r from-gray-50 to-background">
                  <div className="text-sm text-muted-foreground text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span>⭐</span>
                      <span>TxRay Collection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

MobileHeader.displayName = "MobileHeader";

export { MobileHeader };
