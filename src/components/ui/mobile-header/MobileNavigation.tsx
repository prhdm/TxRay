import * as React from "react";
import {cn} from "../lib/utils";
import {BarChart3, LogOut, Package, User} from 'lucide-react';

interface MobileNavigationProps {
    user?: {
        address?: string;
        username?: string | null;
    } | null;
    navigationItems?: Array<{
        label: string;
        href?: string;
        onClick?: () => void;
        isActive?: boolean;
    }>;
    activeNavigation?: string;
    onNavigationChange?: (page: string) => void;
    onProfileClick?: () => void;
    onMenuToggle?: () => void;
    onLogoutClick: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
                                                                      user,
                                                                      navigationItems = [],
                                                                      activeNavigation,
                                                                      onNavigationChange,
                                                                      onProfileClick,
                                                                      onMenuToggle,
                                                                      onLogoutClick,
                                                                  }) => {
    return (
        <>
            {/* Navigation Items */}
            <nav className="flex-1 p-4">
                <div className="space-y-1">
                    {/* Profile Button - Only show if user is authenticated */}
                    {user && (
                        <button
                            onClick={() => {
                                if (onProfileClick) {
                                    onProfileClick();
                                }
                                onMenuToggle?.(); // Close menu after navigation
                            }}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-lg text-foreground hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring transform hover:scale-[1.02]",
                                (activeNavigation === 'Profile') && "bg-[#B9FF66] text-black font-medium shadow-sm"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <User className="w-5 h-5"/>
                                <span>Profile</span>
                            </div>
                        </button>
                    )}

                    {/* Inventory and Analytics - Always show */}
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
                                {item.label === 'Inventory' ? (
                                    <Package className="w-5 h-5"/>
                                ) : item.label === 'Analytics' ? (
                                    <BarChart3 className="w-5 h-5"/>
                                ) : (
                                    <User className="w-5 h-5"/>
                                )}
                                <span>{item.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Logout Button - Only show if user is authenticated */}
            {user && (
                <div className="p-4 border-t border-border">
                    <button
                        onClick={onLogoutClick}
                        className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 transform hover:scale-[1.02]"
                    >
                        <div className="flex items-center space-x-3">
                            <LogOut className="w-5 h-5"/>
                            <span>Logout</span>
                        </div>
                    </button>
                </div>
            )}
        </>
    );
};
