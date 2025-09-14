import * as React from "react"
import {RefreshCw} from "lucide-react"
import {cn} from "@/components/ui/lib/utils"

export interface CollectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string
    description: string
    variant?: "default" | "primary"
    onMint?: () => void
    isMinting?: boolean
    isDisabled?: boolean
    buttonText?: string
    loadingText?: string
    showRefreshIcon?: boolean
}

const CollectionHeader = React.forwardRef<HTMLDivElement, CollectionHeaderProps>(
    ({
         className,
         title,
         description,
         variant = "default",
         onMint,
         isMinting = false,
         isDisabled = false,
         buttonText = "Mint",
         loadingText = "Minting...",
         showRefreshIcon = false,
         ...props
     }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex flex-col lg:flex-row items-center lg:items-center justify-between gap-3 lg:gap-6 mb-8 sm:mb-12 w-full",
                    className
                )}
                {...props}
            >
                {/* Title and Description Group */}
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-3 lg:gap-4 flex-1">
                    {/* Title with background */}
                    <div className="flex justify-center lg:justify-start w-full lg:w-auto">
                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-rarity-bg">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black text-center lg:text-left whitespace-nowrap">
                                {title}
                            </h2>
                        </div>
                    </div>

                    {/* Description - closer to title */}
                    <div className="flex justify-center lg:justify-start w-full lg:w-auto">
                        <p className="text-xs sm:text-sm font-normal leading-relaxed text-black text-center lg:text-left max-w-full lg:max-w-2xl">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Mint Button - centered vertically with less height */}
                {onMint && (
                    <div className="flex justify-center lg:justify-end w-full lg:w-auto items-center">
                        <button
                            onClick={onMint}
                            disabled={isMinting || isDisabled}
                            className={cn(
                                "relative px-6 py-2 sm:px-8 sm:py-2.5 text-sm sm:text-base border border-[#191A23] rounded-lg sm:rounded-[14px] bg-[#B9FF66] text-black font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group min-w-[120px] sm:min-w-[164px] w-full sm:w-auto",
                                (isMinting || isDisabled) && "opacity-50 cursor-not-allowed hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-0"
                            )}
                        >
                            {/* Fill Animation Background */}
                            <div
                                className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>

                            {/* Button Text */}
                            <span className="relative z-10 flex items-center justify-center w-full h-full text-center">
                                {isMinting ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        {showRefreshIcon ? (
                                            <RefreshCw className="h-4 w-4 animate-spin"/>
                                        ) : (
                                            <div
                                                className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                        )}
                                        <span className="text-base font-medium">{loadingText}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        {showRefreshIcon && <RefreshCw className="h-4 w-4"/>}
                                        <span className="text-base font-medium">{buttonText}</span>
                                    </div>
                                )}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        )
    }
)
CollectionHeader.displayName = "CollectionHeader"

export {CollectionHeader}
