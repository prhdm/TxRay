import * as React from "react"
import {cn} from "@/components/ui/lib/utils"

export interface MintStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
    totalMinted: number
    totalSupply: number
    totalBurned: number
    availableToMint: number
    userMintCount: number
    userCanMint: number
    isLoading?: boolean
    isAuthenticated?: boolean
}

const MintStatsCard = React.forwardRef<HTMLDivElement, MintStatsCardProps>(
    ({
         className,
         totalMinted,
         totalSupply,
         totalBurned,
         availableToMint,
         userMintCount,
         userCanMint,
         isLoading = false,
         isAuthenticated = false,
         ...props
     }, ref) => {

        return (
            <div
                ref={ref}
                className={cn(
                    "flex justify-between items-center p-4 sm:p-6 lg:p-8 w-full min-h-[80px] border border-[#191A23] shadow-[0px_5px_0px_#191A23] rounded-3xl sm:rounded-[45px] bg-[#F3F3F3]",
                    className
                )}
                {...props}
            >
                {/* Available to mint (user-specific if authenticated, global if not) */}
                <div className="flex-1 text-center">
          <span className="font-['Space_Grotesk'] font-medium text-lg sm:text-xl lg:text-2xl text-[#000000]">
            {isAuthenticated
                ? `You can mint: ${isLoading ? "..." : userCanMint.toLocaleString()}`
                : `Available to mint: ${isLoading ? "..." : availableToMint.toLocaleString()}`
            }
          </span>
                </div>

                {/* Total minted */}
                <div className="flex-1 text-center">
          <span className="font-['Space_Grotesk'] font-medium text-lg sm:text-xl lg:text-2xl text-[#000000]">
            {isAuthenticated
                ? `You minted: ${isLoading ? "..." : userMintCount.toLocaleString()}`
                : `Total minted: ${isLoading ? "..." : totalMinted.toLocaleString()}`
            }
          </span>
                </div>
            </div>
        )
    }
)
MintStatsCard.displayName = "MintStatsCard"

export {MintStatsCard}
