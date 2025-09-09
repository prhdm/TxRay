import * as React from "react"
import { cn } from "./lib/utils"

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  logoText?: string
  contactEmail?: string
  onSubscribe?: (email: string) => void
  onPrivacyPolicyClick?: () => void
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ 
    className, 
    logoText = "logoipsum", 
    contactEmail = "info@txray.xyz",
    onSubscribe,
    onPrivacyPolicyClick,
    ...props 
  }, ref) => {
    const [email, setEmail] = React.useState("")

    const handleSubscribe = (e: React.FormEvent) => {
      e.preventDefault()
      if (onSubscribe && email.trim()) {
        onSubscribe(email.trim())
        setEmail("")
      }
    }

    return (
      <footer
        ref={ref}
        className={cn(
          "w-full max-w-7xl mx-auto mt-auto px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        <div className="bg-custom-dark text-white rounded-t-[45px] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              {logoText}
              <span className="text-lg">⭐</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            {/* Left side - Contact Info */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-foreground text-sm font-semibold">
                Contact us:
              </div>
              <div className="text-white text-lg">
                Email: {contactEmail}
              </div>
            </div>

            {/* Right side - Newsletter Subscription */}
            <div className="flex-1">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white placeholder-white/70 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary text-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-custom-dark"
                >
                  Subscribe to news
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-600 mb-6"></div>

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-white">
              © 2025 TxRay All Rights Reserved.
            </div>
            <button
              onClick={onPrivacyPolicyClick}
              className="text-white underline hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    )
  }
)
Footer.displayName = "Footer"

export { Footer }
