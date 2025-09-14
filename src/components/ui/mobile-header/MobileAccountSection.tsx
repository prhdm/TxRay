import * as React from "react";
import {cn} from "../lib/utils";

interface MobileAccountSectionProps {
    user?: {
        address?: string;
        username?: string | null;
    } | null;
    needsWalletConnection?: boolean;
    onWalletConnect?: () => void;
    onStartConnectionAttempt?: () => void;
    connectModalOpen?: boolean;
    authFlowState?: 'idle' | 'connecting' | 'network_check' | 'network_switch' | 'signing' | 'authenticating' | 'completed';
    waitingForDisconnect?: boolean;
    onConnectClick: () => void;
}

export const MobileAccountSection: React.FC<MobileAccountSectionProps> = ({
                                                                              user,
                                                                              needsWalletConnection,
                                                                              connectModalOpen,
                                                                              authFlowState,
                                                                              waitingForDisconnect,
                                                                              onConnectClick,
                                                                          }) => {
    return (
        <div className="p-4 border-b border-border bg-gradient-to-r from-gray-50 to-background">
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-center">
                    {user && !needsWalletConnection ? 'Account' : 'Wallet'}
                </h3>

                {user && !needsWalletConnection ? (
                    <div className="space-y-2">
                        {/* Wallet Address */}
                        <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Wallet</p>
                                <p className="text-sm font-mono text-foreground">
                                    {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
                                </p>
                            </div>
                        </div>

                        {/* Username */}
                        {user.username && (
                            <div className="flex items-center justify-center p-3 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Username</p>
                                    <p className="text-sm text-foreground">{user.username}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={onConnectClick}
                        disabled={connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect}
                        className={cn(
                            "w-full relative px-4 py-3 text-sm border border-foreground rounded-md bg-background text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_2px_0_0_rgba(0,0,0,1)] hover:shadow-[0_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group min-w-[140px]",
                            (connectModalOpen || authFlowState === 'connecting' || authFlowState === 'network_check' || authFlowState === 'network_switch' || authFlowState === 'signing' || authFlowState === 'authenticating' || waitingForDisconnect) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div
                            className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
                        <span className="relative z-10">
              {waitingForDisconnect ? 'Disconnecting...' :
                  connectModalOpen ? 'Connecting...' :
                      authFlowState === 'connecting' ? 'Connecting...' :
                          authFlowState === 'network_check' ? 'Checking...' :
                              authFlowState === 'network_switch' ? 'Switching...' :
                                  authFlowState === 'signing' ? 'Signing...' :
                                      authFlowState === 'authenticating' ? 'Auth...' :
                                          'Connect Wallet'}
            </span>
                    </button>
                )}
            </div>
        </div>
    );
};
