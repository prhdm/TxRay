import * as React from "react"
import {Logo} from '../logo'

interface HeaderLogoProps {
    logo?: React.ReactNode
    onLogoClick?: () => void
}

export const HeaderLogo = React.forwardRef<HTMLButtonElement, HeaderLogoProps>(
    ({logo, onLogoClick}, ref) => {
        return (
            <div className="flex items-center space-x-3">
                <button
                    ref={ref}
                    onClick={onLogoClick}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
                    disabled={!onLogoClick}
                >
                    {logo || <Logo size="lg"/>}
                </button>
            </div>
        )
    }
)

HeaderLogo.displayName = "HeaderLogo"
