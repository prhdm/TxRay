import * as React from "react"
import { cn } from "./lib/utils"

export interface RarityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rarity: string
  rarityLevel: string
  cardCount: number
  onUpgrade?: () => void
  variant?: "default" | "primary" | "dark"
  canUpgrade?: boolean
  tokenId?: number
}

const RarityCard = React.forwardRef<HTMLDivElement, RarityCardProps>(
  ({ className, rarity, rarityLevel, cardCount, onUpgrade, variant = "default", canUpgrade = cardCount >= 2, tokenId, ...props }, ref) => {
    // Calculate colors based on tokenId % 3
    const getMod3 = () => {
      if (!tokenId) return 0;
      return tokenId % 3;
    };

    const mod3 = getMod3();

    // Card background color based on n%3
    const getCardBackgroundColor = () => {
      switch (mod3) {
        case 1: return "#F3F3F3"; // n%3 = 1
        case 2: return "#B9FF66"; // n%3 = 2
        case 0: return "#191A23"; // n%3 = 0
        default: return "#F3F3F3";
      }
    };

    // Text background color based on n%3
    const getTextBackgroundColor = () => {
      return mod3 === 1 ? "#B9FF66" : "#F3F3F3"; // n%3=1 gets green, others get light gray
    };

    // Button color based on n%3
    const getButtonColor = () => {
      return mod3 === 0 ? "#F3F3F3" : "#191A23"; // n%3=0 gets light gray, others get dark
    };

    // Text color for backgrounds
    const getTextColor = (bgColor: string) => {
      return bgColor === "#191A23" ? "#FFFFFF" : "#000000";
    };


    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col lg:flex-row justify-between items-center p-[30px] lg:p-[50px] gap-[25px] lg:gap-[77px] w-full h-auto lg:h-[350px] border border-[#191A23] shadow-[0px_5px_0px_#191A23] rounded-[45px] box-border",
          getCardBackgroundColor() === "#F3F3F3" ? "bg-[#F3F3F3]" : "",
          getCardBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "",
          getCardBackgroundColor() === "#191A23" ? "bg-[#191A23]" : "",
          className
        )}
        {...props}
      >
        {/* Left side - Heading and link */}
        <div className="flex flex-col justify-center items-center lg:items-start p-0 gap-[25px] lg:gap-[35px] w-full lg:w-auto h-auto lg:h-[250px] box-border">
          {/* Rarity label */}
          <div className={cn(
            "flex flex-col items-start p-0 gap-[10px] w-[140px] h-[45px] rounded-[7px] box-border",
            getTextBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
          )}>
            <div className="w-[126px] h-[45px] font-['Space_Grotesk'] font-medium text-[24px] lg:text-[32px] leading-[45px] text-[#000000] box-border">
              {rarity}
            </div>
          </div>

          {/* Rarity level */}
          <div className={cn(
            "flex flex-col items-start p-0 gap-[10px] w-[200px] h-[45px] rounded-[7px] box-border",
            getTextBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
          )}>
            <div className="w-[186px] h-[45px] font-['Space_Grotesk'] font-medium text-[24px] lg:text-[32px] leading-[45px] text-[#000000] box-border">
              {rarityLevel}
            </div>
          </div>

          {/* Card count */}
          <div className={cn(
            "flex flex-col justify-center items-center p-0 gap-[10px] w-full lg:w-[220px] h-[40px] rounded-[7px] box-border",
            getTextBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
          )}>
            <div className="w-full lg:w-[206px] h-[40px] font-['Space_Grotesk'] font-medium text-[24px] lg:text-[32px] leading-[40px] text-[#000000] text-center box-border">
              {cardCount}/2 Collected
            </div>
          </div>

          {/* Upgrade button */}
          <button
            onClick={canUpgrade ? onUpgrade : undefined}
            disabled={!canUpgrade}
            className={cn(
              "flex flex-row justify-center items-center px-[25px] lg:px-[40px] py-[18px] lg:py-[22px] gap-[10px] w-full lg:w-[180px] h-[48px] rounded-[14px] font-['Space_Grotesk'] font-normal text-[18px] lg:text-[22px] leading-[32px] text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              getButtonColor() === "#191A23" ? "bg-[#191A23] text-[#FFFFFF]" : "bg-[#F3F3F3] text-[#000000]",
              !canUpgrade && "opacity-50 cursor-not-allowed"
            )}
          >
            {canUpgrade ? "Upgrade" : "Need 2+ Tokens"}
          </button>
        </div>

        {/* Right side - Illustration */}
        <div className="flex-shrink-0 w-full lg:w-auto max-w-[240px] h-[160px] lg:h-[220px] box-border">
          <div className="relative w-full h-full bg-muted rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
            <div className="text-center text-muted-foreground">
              <div className="text-3xl lg:text-4xl mb-2">🎴</div>
              <div className="text-sm font-medium">Rarity Image</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
RarityCard.displayName = "RarityCard"

export { RarityCard }
