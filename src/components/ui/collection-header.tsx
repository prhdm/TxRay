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
          "flex flex-col lg:flex-row items-center justify-center gap-6 mb-12",
          className
        )}
        {...props}
      >
        {/* Title with background */}
        <div className="flex justify-center lg:justify-start w-full lg:w-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-rarity-bg">
            <h2 className="text-[40px] lg:text-[40px] md:text-3xl sm:text-2xl font-medium leading-[51px] lg:leading-[51px] text-black text-center lg:text-left" style={{ width: '187px', height: '51px' }}>{title}</h2>
          </div>
        </div>

        {/* Description */}
        <div className="flex justify-center lg:justify-start w-full lg:w-auto max-w-2xl">
          <p className="text-base font-normal leading-5 text-black flex items-center text-center lg:text-left" style={{ width: '705px', height: '40px', maxWidth: '100%' }}>
            {description}
          </p>
        </div>

        {/* Mint Button */}
        {onMint && (
          <div className="flex justify-center lg:justify-start w-full lg:w-auto">
            <button
              onClick={onMint}
              disabled={isMinting || isDisabled}
              className={cn(
                "flex items-center justify-center gap-2.5 px-8 py-5 border border-[#191A23] rounded-[14px] bg-[#B9FF66] text-black font-normal text-xl lg:text-xl md:text-lg sm:text-base leading-7 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0px_5px_0px_#191A23] hover:shadow-[0px_7px_0px_#191A23] hover:-translate-y-0.5",
                (isMinting || isDisabled) && "opacity-50 cursor-not-allowed hover:shadow-[0px_5px_0px_#191A23] hover:translate-y-0"
              )}
              style={{ width: '164px', height: '41px' }}
            >
              {isMinting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Minting...</span>
                </div>
              ) : (
                <span style={{ width: '44px', height: '28px', textAlign: 'center' }}>Mint</span>
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
