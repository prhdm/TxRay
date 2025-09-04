import * as React from "react"
import { cn } from "./lib/utils"

export interface CollectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  variant?: "default" | "primary"
  onMint?: () => void
}

const CollectionHeader = React.forwardRef<HTMLDivElement, CollectionHeaderProps>(
  ({ className, title, description, variant = "default", onMint, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col md:flex-row items-start md:items-center gap-6 mb-12",
          className
        )}
        {...props}
      >
        {/* Title with background */}
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-rarity-bg">
          <h1 className="text-3xl font-bold text-rarity-text">{title}</h1>
        </div>
        
        {/* Description */}
        <div className="flex-1 max-w-2xl">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Mint Button */}
        {onMint && (
          <div className="flex-shrink-0">
            <button
              onClick={onMint}
              className="px-4 py-2 border border-foreground rounded-md bg-[#B9FF66] text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              Mint
            </button>
          </div>
        )}
      </div>
    )
  }
)
CollectionHeader.displayName = "CollectionHeader"

export { CollectionHeader }
