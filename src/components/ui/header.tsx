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
    walletButtonText = "Connect to wallet",
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
    const { openConnectModal } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

    console.log('Header render - user:', user, 'authFlowState:', authFlowState, 'isConnected:', isConnected, 'address:', address);

    // Trigger authentication when wallet connects (only if we initiated the connection)
    React.useEffect(() => {
      console.log('Header useEffect check:', { isConnected, address, authFlowState, hasOnAuthenticated: !!onAuthenticated, hasOnStartConnectionAttempt: !!onStartConnectionAttempt, hasUser: !!user });

      // If user is already authenticated, don't trigger auth again
      if (user && user.address === address) {
        console.log('User already authenticated with this address, skipping auth trigger');
        return;
      }

      if (isConnected && address && onAuthenticated && authFlowState === 'connecting') {
        console.log('Wallet connected successfully, will trigger authentication in 300ms');
        // Add a small delay to ensure this isn't a brief connection flash from cancellation
        const timeoutId = setTimeout(() => {
          console.log('Triggering authentication for address:', address);
          onAuthenticated(address);
        }, 300); // Reduced delay

        return () => clearTimeout(timeoutId);
      }
      // Don't automatically start connection attempt if wallet is connected but flow is idle
      // Let user explicitly click connect button
    }, [isConnected, address, onAuthenticated, authFlowState, onStartConnectionAttempt, user]);

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
          "flex items-center justify-between w-full max-w-4xl mx-auto py-6 px-6 pt-8",
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
              userName={user.username || user.address || 'User'}
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
                console.log('Connect button clicked, current state:', { isConnected, authFlowState });

                // Always start with a fresh connection attempt
                if (onStartConnectionAttempt) {
                  console.log('Starting connection attempt');
                  onStartConnectionAttempt();
                }

                // If wallet is already connected, disconnect it first to force wallet selection
                if (isConnected) {
                  console.log('Disconnecting existing wallet to show wallet selection');
                  disconnect();
                  // Add a small delay to ensure disconnect completes before opening modal
                  setTimeout(() => {
                    console.log('Opening connect modal after disconnect delay');
                    openConnectModal?.();
                    onWalletConnect?.();
                  }, 200); // Increased delay to ensure state is stable
                } else {
                  // Open connect modal (will show wallet selection if disconnected)
                  console.log('Opening connect modal');
                  openConnectModal?.();
                  onWalletConnect?.();
                }
              }}
              disabled={authFlowState === 'connecting' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating'}
              className={cn(
                "relative px-4 py-2 border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group",
                (authFlowState === 'connecting' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating') && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Fill Animation Background */}
              <div className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>

              {/* Button Text */}
              <span className="relative z-10">
                {authFlowState === 'connecting' ? 'Connecting...' :
                 authFlowState === 'network_check' ? 'Checking Network...' :
                 authFlowState === 'network_switch' ? 'Switching Network...' :
                 authFlowState === 'signing' ? 'Signing...' :
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
