import * as React from "react"
import { cn } from "./lib/utils"
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'

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
  activeNavigation?: string
  onNavigationChange?: (page: string) => void
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
    activeNavigation,
    onNavigationChange,
    ...props 
  }, ref) => {
    const { openConnectModal } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
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
          {logo || (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-foreground">{brandName}</span>
              <span className="text-lg">⭐</span>
            </div>
          )}
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

          {/* Custom Wallet Connect Button */}
          <button
            onClick={() => {
              if (isConnected) {
                // Open account modal to show account details and disconnect option
                openAccountModal?.();
              } else {
                // Open RainbowKit connect modal
                openConnectModal?.();
              }
              // Call the original onWalletConnect if provided
              if (onWalletConnect) {
                onWalletConnect();
              }
            }}
            className="relative px-4 py-2 border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group"
          >
            {/* Fill Animation Background */}
            <div className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
            
            {/* Button Text */}
            <span className="relative z-10">
              {isConnected 
                ? `${address?.slice(0, 6)}...${address?.slice(-4)}` 
                : walletButtonText
              }
            </span>
          </button>
        </div>
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header }
