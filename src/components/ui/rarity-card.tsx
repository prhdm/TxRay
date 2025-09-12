import * as React from "react"
import { cn } from "./lib/utils"

export interface RarityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rarity: string
  rarityLevel?: string
  cardCount: number
  onUpgrade?: () => void
  variant?: "default" | "primary" | "dark"
  canUpgrade?: boolean
  tokenId?: number
  isSpecial?: boolean
  hideCollectedCount?: boolean
  hideUpgradeButton?: boolean
  isAuthenticated?: boolean
}

const RarityCard = React.forwardRef<HTMLDivElement, RarityCardProps>(
  ({ className, rarity, rarityLevel, cardCount, onUpgrade, variant = "default", canUpgrade = cardCount >= 2, tokenId, isSpecial = false, hideCollectedCount = false, hideUpgradeButton = false, isAuthenticated = true, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    // Debug logging
    React.useEffect(() => {
      console.log('RarityCard rendered:', {
        tokenId,
        rarity,
        imagePath: `/rarity-${tokenId || 1}.webp`,
        isSpecial
      });
    }, [tokenId, rarity, isSpecial]);

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
          "flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8 w-full border border-[#191A23] shadow-[0px_5px_0px_#191A23] rounded-3xl sm:rounded-[45px]",
          isSpecial 
            ? "p-6 sm:p-8 lg:p-12 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]" 
            : "p-4 sm:p-6 lg:p-8 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]",
          getCardBackgroundColor() === "#F3F3F3" ? "bg-[#F3F3F3]" : "",
          getCardBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "",
          getCardBackgroundColor() === "#191A23" ? "bg-[#191A23]" : "",
          className
        )}
        {...props}
      >
        {/* Mobile: Image first, then content */}
        {/* Desktop: Content first, then image */}
        
        {/* Rarity Card Image - Mobile: Top, Desktop: Right */}
        <div className={cn(
          "flex-shrink-0 w-full md:w-auto order-1 md:order-2",
          isSpecial 
            ? "md:max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] h-[250px] sm:h-[300px] md:h-[450px] lg:h-[500px] xl:h-[550px]"
            : "md:max-w-[300px] lg:max-w-[350px] xl:max-w-[400px] h-[180px] sm:h-[220px] md:h-[280px] lg:h-[320px] xl:h-[350px]"
        )}>
          <div className="relative w-full h-full md:rounded-2xl md:overflow-hidden md:shadow-lg">
            <img
              src={`/rarity-${tokenId || 1}.webp`}
              alt={`${rarity} Card`}
              className="w-full h-full object-contain md:rounded-2xl"
              onError={(e) => {
                console.error(`Failed to load image: /rarity-${tokenId || 1}.webp`);
                // Fallback to first rarity card if specific card doesn't exist
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('rarity-1.webp')) {
                  console.log('Falling back to rarity-1.webp');
                  target.src = '/rarity-1.webp';
                }
              }}
              onLoad={() => {
                console.log(`Successfully loaded image: /rarity-${tokenId || 1}.webp`);
              }}
            />
          </div>
        </div>

        {/* Content - Mobile: Bottom, Desktop: Left */}
        <div className={cn(
          "flex flex-col justify-center items-center md:items-start w-full md:w-auto md:flex-1 order-2 md:order-1",
          isSpecial ? "gap-6 sm:gap-8 lg:gap-10" : "gap-4 sm:gap-6"
        )}>
          {/* Rarity label */}
          <div className={cn(
            "flex items-center justify-center px-4 py-2 rounded-lg w-fit",
            isSpecial ? "px-6 py-3 min-w-[160px]" : "min-w-[120px]",
            getTextBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
          )}>
            <span className={cn(
              "font-['Space_Grotesk'] font-medium text-[#000000] whitespace-nowrap",
              isSpecial ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-xl lg:text-2xl"
            )}>
              {rarity}
            </span>
          </div>

          {/* Card count - conditionally rendered */}
          {!hideCollectedCount && (
            <div className={cn(
              "flex items-center justify-center px-4 py-2 rounded-lg w-full",
              isSpecial ? "px-6 py-3 max-w-[300px]" : "max-w-[200px]",
              getTextBackgroundColor() === "#B9FF66" ? "bg-[#B9FF66]" : "bg-[#F3F3F3]"
            )}>
              <span className={cn(
                "font-['Space_Grotesk'] font-medium text-[#000000] text-center",
                isSpecial ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-xl lg:text-2xl"
              )}>
                {cardCount}/2 Collected
              </span>
            </div>
          )}

          {/* Upgrade button - conditionally rendered */}
          {!hideUpgradeButton && (
            <button
              onClick={canUpgrade ? onUpgrade : undefined}
              disabled={!canUpgrade}
              className={cn(
                "flex items-center justify-center px-4 sm:px-6 py-3 rounded-xl font-['Space_Grotesk'] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full min-h-[48px]",
                isSpecial 
                  ? "px-6 py-4 text-xl sm:text-2xl lg:text-3xl max-w-[300px] min-h-[60px]" 
                  : "text-base sm:text-lg max-w-[200px]",
                getButtonColor() === "#191A23" ? "bg-[#191A23] text-[#FFFFFF] hover:bg-[#2a2b35]" : "bg-[#F3F3F3] text-[#000000] hover:bg-[#e8e8e8]",
                !canUpgrade && "opacity-50 cursor-not-allowed hover:bg-current"
              )}
            >
              {!isAuthenticated ? "Connect Wallet" : "Upgrade"}
            </button>
          )}
        </div>
      </div>
    )
  }
)
RarityCard.displayName = "RarityCard"

export { RarityCard }
