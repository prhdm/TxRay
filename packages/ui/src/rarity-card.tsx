import * as React from "react"
import { cn } from "./lib/utils"

export interface RarityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rarity: string
  rarityLevel: string
  cardCount: number
  onUpgrade?: () => void
  variant?: "default" | "primary" | "dark"
}

const RarityCard = React.forwardRef<HTMLDivElement, RarityCardProps>(
  ({ className, rarity, rarityLevel, cardCount, onUpgrade, variant = "default", ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "primary":
          return "bg-primary border-primary"
        case "dark":
          return "bg-secondary border-secondary"
        default:
          return "bg-card border-card-border"
      }
    }

    const getUpgradeButtonStyles = () => {
      switch (variant) {
        case "primary":
          return "bg-upgrade-btn text-upgrade-btn-text hover:bg-upgrade-btn/90"
        case "dark":
          return "bg-primary text-primary-foreground hover:bg-primary/90"
        default:
          return "bg-upgrade-btn text-upgrade-btn-text hover:bg-upgrade-btn/90"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[45px] border border-[#191A23] border-inset p-6 shadow-[0_5px_0_0_#191A23] transition-all duration-200 hover:shadow-[0_7px_0_0_#191A23] hover:-translate-y-0.5",
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <div className="flex justify-between items-center gap-8">
          {/* Left side - Rarity info and upgrade button */}
          <div className="flex-1 space-y-4">
            {/* Rarity label */}
            <div className="inline-flex items-center px-4 py-2 rounded-xl bg-rarity-bg text-rarity-text text-sm font-bold">
              {rarity}
            </div>
            
            {/* Rarity level */}
            <div className="inline-flex items-center px-4 py-2 rounded-xl bg-rarity-bg text-rarity-text text-xl font-bold">
              {rarityLevel}
            </div>
            
            {/* Card count */}
            <div className="text-lg font-semibold text-foreground">
              {cardCount}/2 Collected
            </div>
            
            {/* Upgrade button */}
            <button
              onClick={onUpgrade}
              className={cn(
                "px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                getUpgradeButtonStyles()
              )}
            >
              Upgrade
            </button>
          </div>
          
          {/* Right side - Placeholder Image */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-muted rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
              <div className="text-center text-muted-foreground">
                <div className="text-3xl mb-1">🎴</div>
                <div className="text-xs font-medium">Rarity Image</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
RarityCard.displayName = "RarityCard"

export { RarityCard }
