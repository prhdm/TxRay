import * as React from "react"
import {cn} from "../lib/utils"

interface ConnectButtonProps {
    walletButtonText?: string
    connectModalOpen?: boolean
    authFlowState?: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed'
    waitingForDisconnect?: boolean
    disabled?: boolean
    onClick: () => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
                                                                walletButtonText = "Connect your wallet",
                                                                connectModalOpen,
                                                                authFlowState = 'idle',
                                                                waitingForDisconnect,
                                                                disabled,
                                                                onClick,
                                                            }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative px-4 py-2 border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Fill Animation Background */}
            <div
                className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>

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
    )
}
