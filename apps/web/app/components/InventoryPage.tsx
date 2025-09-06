"use client";

import { 
  CollectionHeader,
  RarityCard,
} from "@txray/ui";
import { useMint } from "../../src/hooks/useMint";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "@txray/ui";
import { useRarityBalances } from "../../src/hooks/useRarityBalances";
import { useUpgrade } from "../../src/hooks/useUpgrade";
import { useEffect, useRef } from "react";

export default function InventoryPage() {
  const { isAuthenticated, user } = useAuth();
  const { mint, isLoading, error, isSuccess, hash } = useMint();
  const { addNotification } = useNotification();
  const { rarities, isLoading: raritiesLoading, refetch: refetchRarities } = useRarityBalances(10);
  const { upgrade, isLoading: upgradeLoading, error: upgradeError, isSuccess: upgradeSuccess, hash: upgradeHash } = useUpgrade();

  // Refs to track previous states and avoid infinite loops
  const prevMintStateRef = useRef({ isLoading: false, isSuccess: false, error: null as string | null, hash: undefined as `0x${string}` | undefined });
  const prevUpgradeStateRef = useRef({ isLoading: false, isSuccess: false, error: null as string | null, hash: undefined as `0x${string}` | undefined });
  const addNotificationRef = useRef(addNotification);
  const refetchRaritiesRef = useRef(refetchRarities);

  // Update refs when dependencies change
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  useEffect(() => {
    refetchRaritiesRef.current = refetchRarities;
  }, [refetchRarities]);

  // Single useEffect to handle all notifications and state changes
  useEffect(() => {
    const prevMint = prevMintStateRef.current;
    const prevUpgrade = prevUpgradeStateRef.current;

    // Handle mint notifications
    if (isLoading !== prevMint.isLoading || isSuccess !== prevMint.isSuccess || error !== prevMint.error || hash !== prevMint.hash) {
      // Mint started
      if (isLoading && !prevMint.isLoading) {
        addNotificationRef.current({
          type: "info",
          title: "Minting in progress...",
          message: "Please wait while your transaction is being processed.",
          duration: 0, // Don't auto-dismiss while loading
        });
      }

      // Mint successful
      if (isSuccess && !prevMint.isSuccess && !isLoading) {
        addNotificationRef.current({
          type: "success",
          title: "Minting successful!",
          message: hash ? `Transaction hash: ${hash.slice(0, 10)}...${hash.slice(-8)}` : "Your NFT has been minted successfully.",
        });
        // Refetch rarities to update balances
        setTimeout(() => refetchRaritiesRef.current(), 2000);
      }

      // Mint error
      if (error && error !== prevMint.error && !isLoading) {
        addNotificationRef.current({
          type: "error",
          title: "Mint failed",
          message: error,
        });
      }
    }

    // Handle upgrade notifications
    if (upgradeLoading !== prevUpgrade.isLoading || upgradeSuccess !== prevUpgrade.isSuccess || upgradeError !== prevUpgrade.error || upgradeHash !== prevUpgrade.hash) {
      // Upgrade started
      if (upgradeLoading && !prevUpgrade.isLoading) {
        addNotificationRef.current({
          type: "info",
          title: "Upgrading in progress...",
          message: "Please wait while your tokens are being upgraded.",
          duration: 0, // Don't auto-dismiss while loading
        });
      }

      // Upgrade successful
      if (upgradeSuccess && !prevUpgrade.isSuccess && !upgradeLoading) {
        addNotificationRef.current({
          type: "success",
          title: "Upgrade successful!",
          message: upgradeHash ? `Transaction hash: ${upgradeHash.slice(0, 10)}...${upgradeHash.slice(-8)}` : "Your tokens have been upgraded successfully.",
        });
        // Refetch rarities to update balances
        setTimeout(() => refetchRaritiesRef.current(), 2000);
      }

      // Upgrade error
      if (upgradeError && upgradeError !== prevUpgrade.error && !upgradeLoading) {
        addNotificationRef.current({
          type: "error",
          title: "Upgrade failed",
          message: upgradeError,
        });
      }
    }

    // Update refs with current state
    prevMintStateRef.current = { isLoading, isSuccess, error, hash };
    prevUpgradeStateRef.current = { isLoading: upgradeLoading, isSuccess: upgradeSuccess, error: upgradeError, hash: upgradeHash };
  }, [isLoading, isSuccess, error, hash, upgradeLoading, upgradeSuccess, upgradeError, upgradeHash]);

  // Transform rarity data from contract into card format
  const rarityData = rarities.map((rarity, index) => ({
    id: rarity.tokenId,
    rarity: `Rarity ${rarity.level}`,
    rarityLevel: `x${rarity.level}.000`,
    cardCount: Number(rarity.balance ?? 0n),
    variant: (["default", "primary", "dark"] as const)[index % 3],
    canUpgrade: rarity.canUpgrade,
  }));

  const handleUpgrade = async (tokenId: number) => {
    try {
      console.log(`Upgrading Rarity ${tokenId} to Rarity ${tokenId + 1}`);
      const result = await upgrade(tokenId, tokenId + 1);

      if (!result.success) {
        console.error("Upgrade failed:", result.error);
        addNotification({
          type: "error",
          title: "Upgrade failed",
          message: result.error || "Failed to initiate upgrade transaction",
        });
      }
      // Success notifications are handled by useEffect hooks
    } catch (error) {
      console.error("Upgrade error:", error);
      addNotification({
        type: "error",
        title: "Upgrade failed",
        message: "An unexpected error occurred during upgrade",
      });
    }
  };

  const handleMint = async () => {
    if (!isAuthenticated) {
      console.error("User must be authenticated to mint");
      return;
    }

    try {
      console.log("Starting mint process...");
      const result = await mint();

      if (!result.success) {
        console.error("Mint failed:", result.error);
        addNotification({
          type: "error",
          title: "Mint failed",
          message: result.error || "Failed to initiate mint transaction",
        });
      }
      // Success notifications are handled by useEffect hooks
    } catch (error) {
      console.error("Mint error:", error);
      addNotification({
        type: "error",
        title: "Mint failed",
        message: "An unexpected error occurred during minting",
      });
    }
  };

  return (
    <main className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* Collection Header */}
      <CollectionHeader
        title="Drift Pass"
        description="Manage your collection of rarity cards. Mint, burn two and reach the Rarity #13 for 20x in-game multiplier. Combine this pass with Ape, Swell cards and staked Formula Ape to chase the full 170x power-up."
        onMint={handleMint}
        isMinting={isLoading}
        isDisabled={!isAuthenticated}
      />

      {/* Rarity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {raritiesLoading ? (
          // Loading skeleton for rarity cards
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[45px] border border-gray-200 p-6 shadow-lg animate-pulse">
              <div className="flex justify-between items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded-xl w-24"></div>
                  <div className="h-8 bg-gray-200 rounded-xl w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
                </div>
                <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          ))
        ) : (
          rarityData.map((rarity) => (
            <RarityCard
              key={rarity.id}
              rarity={rarity.rarity}
              rarityLevel={rarity.rarityLevel}
              cardCount={rarity.cardCount}
              variant={rarity.variant}
              canUpgrade={rarity.canUpgrade}
              tokenId={rarity.id}
              onUpgrade={() => handleUpgrade(rarity.id)}
              className="w-full"
            />
          ))
        )}
      </div>
    </main>
  );
}
