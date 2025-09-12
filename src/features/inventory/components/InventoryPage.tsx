"use client";

import { 
  CollectionHeader,
  RarityCard,
  MintStatsCard
} from "@/ui";
import { useMint } from "@/hooks/useMint";
import { useAuth } from "@/features/auth/lib/AuthContext";
import { useRarityBalances } from "@/hooks/useRarityBalances";
import { useUpgrade } from "@/hooks/useUpgrade";
import { useMintStats } from "@/hooks/useMintStats";
import React, { useMemo, useCallback, useEffect } from "react";

export default function InventoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { mint, isLoading, error, isSuccess, hash, refetch: refetchMint } = useMint();
  const { rarities, isLoading: raritiesLoading, refetch: refetchRarities } = useRarityBalances();
  const { upgrade, isLoading: upgradeLoading, error: upgradeError, isSuccess: upgradeSuccess, hash: upgradeHash, refetch: refetchUpgrade } = useUpgrade();
  const { totalMinted, totalSupply, totalBurned, availableToMint, userMintCount, userCanMint, isLoading: mintStatsLoading, refetch: refetchMintStats } = useMintStats();

  // Refetch data when transactions succeed
  useEffect(() => {
    if (isSuccess) {
      console.log('Mint transaction succeeded, refetching data...');
      refetchRarities();
      refetchMintStats();
    }
  }, [isSuccess, refetchRarities, refetchMintStats]);

  useEffect(() => {
    if (upgradeSuccess) {
      console.log('Upgrade transaction succeeded, refetching data...');
      refetchRarities();
      refetchMintStats();
    }
  }, [upgradeSuccess, refetchRarities, refetchMintStats]);

  // Create all 13 rarity cards (show all even when not authenticated)
  const allRarityCards = useMemo(() => {
    return Array.from({ length: 13 }, (_, index) => {
      const level = index + 1;
      const rarityData = rarities.find(r => r.level === level);
      
      return {
        id: level,
        rarity: `Rarity ${level}`,
        cardCount: rarityData ? Number(rarityData.balance ?? BigInt(0)) : 0,
        variant: (["default", "primary", "dark"] as const)[index % 3],
        canUpgrade: isAuthenticated && rarityData ? rarityData.canUpgrade : false,
        isSpecial: level === 13, // Mark rarity 13 as special
      };
    });
  }, [rarities]);

  // Separate normal and special cards
  const normalCards = useMemo(() => allRarityCards.filter(card => !card.isSpecial), [allRarityCards]);
  const specialCards = useMemo(() => allRarityCards.filter(card => card.isSpecial), [allRarityCards]);

  const handleUpgrade = useCallback(async (tokenId: number) => {
    try {
      console.log(`Upgrading Rarity ${tokenId} to Rarity ${tokenId + 1}`);
      const result = await upgrade(tokenId, tokenId + 1);

      if (!result.success) {
        console.error("Upgrade failed:", result.error);
        // Error notifications are handled by useEffect hooks
      }
      // Success notifications are handled by useEffect hooks
    } catch (error) {
      console.error("Upgrade error:", error);
      // Error notifications are handled by useEffect hooks
    }
  }, [upgrade]);

  const handleMint = useCallback(async () => {
    if (!isAuthenticated) {
      console.error("User must be authenticated to mint");
      return;
    }

    try {
      console.log("Starting mint process...");
      const result = await mint();

      if (!result.success) {
        console.error("Mint failed:", result.error);
        // Error notifications are handled by useEffect hooks
      }
      // Success notifications are handled by useEffect hooks
    } catch (error) {
      console.error("Mint error:", error);
      // Error notifications are handled by useEffect hooks
    }
  }, [mint]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Collection Header */}
      <CollectionHeader
        title="Drift Pass"
        description="Manage your collection of rarity cards. Mint, burn two and reach the Rarity #13 for 20x in-game multiplier. Combine this pass with Ape, Swell cards and staked Formula Ape to chase the full 170x power-up."
        onMint={handleMint}
        isMinting={isLoading}
        isDisabled={!isAuthenticated}
      />

      {/* Mint Statistics Card */}
      <div className="mb-6 sm:mb-8">
        <MintStatsCard
          totalMinted={totalMinted}
          totalSupply={totalSupply}
          totalBurned={totalBurned}
          availableToMint={availableToMint}
          userMintCount={userMintCount}
          userCanMint={userCanMint}
          isLoading={mintStatsLoading}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Rarity Cards */}
      <div className="space-y-6 sm:space-y-8">
        {raritiesLoading && isAuthenticated ? (
          // Loading skeleton for rarity cards
          <div className="space-y-6 sm:space-y-8">
            {/* Normal cards grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-3xl sm:rounded-[45px] border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-lg animate-pulse min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8 h-full">
                    <div className="flex flex-col gap-4 sm:gap-6 w-full md:flex-1">
                      <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-32 sm:w-36"></div>
                      <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-36 sm:w-40"></div>
                      <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-40 sm:w-44"></div>
                      <div className="h-12 sm:h-14 bg-gray-200 rounded-xl w-full max-w-[200px]"></div>
                    </div>
                    <div className="w-full md:max-w-[300px] lg:max-w-[350px] h-[200px] sm:h-[250px] md:h-[280px] lg:h-[320px] bg-gray-200 rounded-2xl flex-shrink-0"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Special card skeleton */}
            <div className="rounded-3xl sm:rounded-[45px] border border-gray-200 p-6 sm:p-8 lg:p-12 shadow-lg animate-pulse min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 lg:gap-10 h-full">
                <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full md:flex-1">
                  <div className="h-12 sm:h-16 lg:h-20 bg-gray-200 rounded-lg w-40 sm:w-48"></div>
                  <div className="h-12 sm:h-16 lg:h-20 bg-gray-200 rounded-lg w-48 sm:w-56"></div>
                  <div className="h-16 sm:h-20 lg:h-24 bg-gray-200 rounded-xl w-full max-w-[300px]"></div>
                </div>
                <div className="w-full md:max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] bg-gray-200 rounded-2xl flex-shrink-0"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Normal Cards Grid */}
            {normalCards.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {normalCards.map((rarity) => (
                  <RarityCard
                    key={rarity.id}
                    rarity={rarity.rarity}
                    cardCount={rarity.cardCount}
                    variant={rarity.variant}
                    canUpgrade={rarity.canUpgrade}
                    tokenId={rarity.id}
                    isAuthenticated={isAuthenticated}
                    onUpgrade={isAuthenticated ? () => handleUpgrade(rarity.id) : undefined}
                    className="w-full"
                  />
                ))}
              </div>
            )}

            {/* Special Cards (Full Width) */}
            {specialCards.map((rarity) => (
              <div key={rarity.id} className="w-full">
                <RarityCard
                  rarity={rarity.rarity}
                  cardCount={rarity.cardCount}
                  variant={rarity.variant}
                  canUpgrade={false} // Rarity 13 cannot be upgraded
                  tokenId={rarity.id}
                  isSpecial={true}
                  hideUpgradeButton={true} // Hide upgrade button for rarity 13
                  className="w-full"
                />
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
