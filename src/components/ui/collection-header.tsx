import * as React from "react"
import { cn } from "./lib/utils"

export interface CollectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  variant?: "default" | "primary"
  onMint?: () => void
  isMinting?: boolean
  isDisabled?: boolean
}

const CollectionHeader = React.forwardRef<HTMLDivElement, CollectionHeaderProps>(
  ({ className, title, description, variant = "default", onMint, isMinting = false, isDisabled = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 w-full",
          className
        )}
        {...props}
      >
        {/* Title with background */}
        <div className="flex justify-center lg:justify-start w-full lg:w-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-rarity-bg">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black text-center lg:text-left whitespace-nowrap">
              {title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <div className="flex justify-center lg:justify-start w-full lg:flex-1 lg:max-w-none">
          <p className="text-xs sm:text-sm font-normal leading-relaxed text-black text-center lg:text-left w-full">
            {description}
          </p>
        </div>

        {/* Mint Button */}
        {onMint && (
          <div className="flex justify-center lg:justify-end w-full lg:w-auto">
            <button
              onClick={onMint}
              disabled={isMinting || isDisabled}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 border border-[#191A23] rounded-md bg-[#B9FF66] text-black font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0px_4px_0px_#191A23] hover:shadow-[0px_6px_0px_#191A23] hover:-translate-y-0.5 whitespace-nowrap",
                (isMinting || isDisabled) && "opacity-50 cursor-not-allowed hover:shadow-[0px_4px_0px_#191A23] hover:translate-y-0"
              )}
            >
              {isMinting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Minting...</span>
                </div>
              ) : (
                <span>Mint</span>
              )}
            </button>
          </div>
        )}
      </div>
    )
  }
)
CollectionHeader.displayName = "CollectionHeader"

export { CollectionHeader }
