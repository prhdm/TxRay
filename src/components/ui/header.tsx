import * as React from "react"
import { cn } from "./lib/utils"
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'
import { ProfileDropdown } from './profile-dropdown'

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  brandName?: string
  navigationItems?: Array<{
    label: string
    href?: string
    onClick?: () => void
    isActive?: boolean
  }>
  walletButtonText?: string
  onWalletConnect?: () => void
  onAuthenticated?: (address: string) => void
      onLogout?: () => void
    onProfileClick?: () => void
    onLogoClick?: () => void
      user?: {
    address?: string
    username?: string | null
  } | null
    activeNavigation?: string
    onNavigationChange?: (page: string) => void
    authFlowState?: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed'
    onResetAuthFlow?: () => void
    onStartConnectionAttempt?: () => void
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
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
    ...props
  }, ref) => {
    const { openConnectModal, connectModalOpen } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
    const [waitingForDisconnect, setWaitingForDisconnect] = React.useState(false);

    console.log('Header render - user:', user, 'authFlowState:', authFlowState, 'isConnected:', isConnected, 'address:', address, 'connectModalOpen:', connectModalOpen);

    // Trigger authentication when wallet connects (only if we initiated the connection)
    React.useEffect(() => {
      console.log('Header useEffect check:', { isConnected, address, authFlowState, hasOnAuthenticated: !!onAuthenticated, hasOnStartConnectionAttempt: !!onStartConnectionAttempt, hasUser: !!user });

      // If user is already authenticated, don't trigger auth again
      if (user && user.address === address) {
        console.log('User already authenticated with this address, skipping auth trigger');
        return;
      }

      // Only trigger authentication if we're in connecting state and have the necessary callbacks
      if (isConnected && address && onAuthenticated && authFlowState === 'connecting') {
        console.log('Wallet connected successfully, will trigger authentication in 300ms');
        // Add a small delay to ensure this isn't a brief connection flash from cancellation
        const timeoutId = setTimeout(() => {
          console.log('Triggering authentication for address:', address);
          onAuthenticated(address);
        }, 300); // Reduced delay

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
    
    React.useEffect(() => {
      console.log('Modal state effect:', { connectModalOpen, wasModalOpen, authFlowState, isConnected, address });
      
      if (connectModalOpen) {
        console.log('Modal opened, setting wasModalOpen to true');
        setWasModalOpen(true);
      } else if (wasModalOpen && !connectModalOpen) {
        // Modal was open and is now closed
        console.log('Modal closed, wasModalOpen was true');
        setWasModalOpen(false);
        
        // Only reset if we're still in connecting state and no wallet is connected
        if (authFlowState === 'connecting' && !isConnected && !address && onResetAuthFlow) {
          console.log('Modal closed without connecting, will reset in 1 second');
          const timeoutId = setTimeout(() => {
            // Final check before resetting
            if (authFlowState === 'connecting' && !isConnected && !address) {
              console.log('Resetting auth flow after modal close');
              onResetAuthFlow();
            } else {
              console.log('Auth state changed during timeout, not resetting:', { authFlowState, isConnected, address });
            }
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        } else {
          console.log('Not resetting because conditions not met:', { authFlowState, isConnected, address, hasOnResetAuthFlow: !!onResetAuthFlow });
        }
      }
    }, [connectModalOpen, wasModalOpen, authFlowState, isConnected, address, onResetAuthFlow]);


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
        <div className="flex items-center space-x-3">
          <button
            onClick={onLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
            disabled={!onLogoClick}
          >
            {logo || (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-foreground">{brandName}</span>
                <span className="text-lg">⭐</span>
              </div>
            )}
          </button>
        </div>

        {/* Right side - Navigation and Wallet */}
        <div className="flex items-center space-x-6">
          {/* Navigation Items */}
          <nav className="flex items-center space-x-6">
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
                }}
                className={cn(
                  "text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-none",
                  (activeNavigation === item.label || item.isActive) && "underline"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>


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
                console.log('Connect button clicked, current state:', { isConnected, authFlowState, hasUser: !!user });

                // Always start with a fresh connection attempt
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
              }}
              disabled={connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect}
              className={cn(
                "relative px-4 py-2 border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group",
                (connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect) && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Fill Animation Background */}
              <div className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>

              {/* Button Text */}
              <span className="relative z-10">
                {waitingForDisconnect ? 'Disconnecting...' :
                 connectModalOpen ? 'Connecting...' :
                 authFlowState === 'connecting' ? 'Connecting...' :
                 authFlowState === 'network_check' ? 'Checking Network...' :
                 authFlowState === 'network_switch' ? 'Switching Network...' :
                 authFlowState === 'signing' ? 'Signing Message...' :
                 authFlowState === 'authenticating' ? 'Authenticating...' :
                 walletButtonText}
              </span>
            </button>
          )}
        </div>
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }
