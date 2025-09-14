import * as React from "react";
import {cn} from "../lib/utils";
import {Menu, X} from 'lucide-react';
import {Logo} from '../logo';

interface MobileMenuHeaderProps {
    logo?: React.ReactNode;
    onLogoClick?: () => void;
    isMenuOpen?: boolean;
    onMenuToggle?: () => void;
    className?: string;
}

export const MobileMenuHeader = React.forwardRef<HTMLElement, MobileMenuHeaderProps>(
    ({logo, onLogoClick, isMenuOpen, onMenuToggle, className, ...props}, ref) => {
        return (
            <header
                ref={ref}
                className={cn(
                    "flex items-center justify-between w-full px-4 py-4 bg-background border-b border-border shadow-sm",
                    className
                )}
                {...props}
            >
                {/* Left side - Empty space for balance */}
                <div className="w-12"></div>

                {/* Center - Logo */}
                <div className="flex items-center justify-center flex-1">
                    <button
                        onClick={onLogoClick}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
                        disabled={!onLogoClick}
                    >
                        {logo || <Logo size="md"/>}
                    </button>
                </div>

                {/* Right side - Menu button only */}
                <div className="flex items-center">
                    <button
                        onClick={onMenuToggle}
                        className="p-2 rounded-md hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring transform hover:scale-105"
                        aria-label="Toggle menu"
                    >
                        <div className="relative w-5 h-5">
                            {isMenuOpen ? (
                                <X className="h-5 w-5 text-foreground animate-in fade-in duration-200"/>
                            ) : (
                                <Menu className="h-5 w-5 text-foreground animate-in fade-in duration-200"/>
                            )}
                        </div>
                    </button>
                </div>
            </header>
        );
    }
);

MobileMenuHeader.displayName = "MobileMenuHeader";
