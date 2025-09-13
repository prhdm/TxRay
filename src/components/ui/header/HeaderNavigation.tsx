import * as React from "react"
import {cn} from "../lib/utils"

interface HeaderNavigationProps {
    navigationItems?: Array<{
        label: string
        href?: string
        onClick?: () => void
        isActive?: boolean
    }>
    activeNavigation?: string
    onNavigationChange?: (page: string) => void
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
                                                                      navigationItems = [
                                                                          {label: "Inventory"},
                                                                          {label: "Analytics"}
                                                                      ],
                                                                      activeNavigation,
                                                                      onNavigationChange,
                                                                  }) => {
    return (
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
    )
}
