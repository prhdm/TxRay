import * as React from "react"
import { cn } from "./lib/utils"
import { Logo } from "./logo"

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  // Simplified props - no longer needed
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ 
    className, 
    ...props 
  }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          "w-full max-w-7xl mx-auto mt-auto px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        <div className="bg-custom-dark text-white rounded-t-[45px] py-8 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Logo size="lg" className="text-white" />
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 mb-6"></div>

          {/* Copyright */}
          <div className="text-center text-sm text-white/80">
            © 2025 TxRay All Rights Reserved.
          </div>
        </div>
      </footer>
    )
  }
)
Footer.displayName = "Footer"

export { Footer }
