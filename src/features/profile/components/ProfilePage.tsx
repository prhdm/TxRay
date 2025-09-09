"use client";

import {
  CollectionHeader,
  RarityCard
} from "@/ui";
import { useAuth } from "@/features/auth/lib/AuthContext";
import { useRarityBalances } from "@/hooks/useRarityBalances";
import { useState } from "react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { rarities, isLoading: raritiesLoading } = useRarityBalances();
  // Notification system disabled
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || "");

  // Filter to only show user's owned cards (balance > 0)
  const userCards = rarities.filter(rarity => (rarity.balance ?? BigInt(0)) > BigInt(0));

  const handleNameChange = async () => {
    if (!newName.trim()) {
      console.log("Invalid name provided");
      return;
    }

    try {
      // In a real implementation, this would call an API to update the user's name
      // For now, we'll just update the local state
      if (updateUser) {
        updateUser({
          ...user,
          username: newName.trim(),
        });
      }

      console.log("Name updated successfully");

      setIsEditingName(false);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handleCancelEdit = () => {
    setNewName(user?.username || "");
    setIsEditingName(false);
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and view your collection.</p>
      </div>

      {/* User Information Card */}
      <div className="mb-8 p-6 bg-card border border-card-border rounded-[45px] shadow-[0_5px_0_0_#191A23]">
        <h2 className="text-xl font-semibold text-foreground mb-6">Account Information</h2>

        <div className="space-y-4">
          {/* Wallet Address */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
              <p className="text-foreground font-mono text-sm">
                {user?.wallet_address?.slice(0, 6)}...{user?.wallet_address?.slice(-4)}
              </p>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-1 text-sm border border-input rounded-md bg-background"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                  <button
                    onClick={handleNameChange}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs border border-muted-foreground rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-foreground">{user?.username || "No name set"}</p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-foreground text-sm">#{user?.id || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User's Collection */}
      <div className="mb-8">
        <CollectionHeader
          title="Your Collection"
          description={`You own ${userCards.length} different rarity types.`}
        />

        {/* Rarity Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6">
          {raritiesLoading ? (
            // Loading skeleton for rarity cards
            Array.from({ length: 6 }).map((_, index) => (
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
            ))
          ) : userCards.length > 0 ? (
            userCards.map((rarity, index) => (
              <RarityCard
                key={rarity.tokenId}
                rarity={`Rarity ${rarity.level}`}
                cardCount={Number(rarity.balance ?? BigInt(0))}
                variant={["default", "primary", "dark"][index % 3] as "default" | "primary" | "dark"}
                tokenId={rarity.tokenId}
                hideCollectedCount={rarity.level === 13} // Hide collected count for rarity 13
                hideUpgradeButton={true} // Hide upgrade button on profile page
                onUpgrade={() => {
                  console.log("Upgrade unavailable on profile page");
                }}
                className="w-full"
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🎴</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Cards Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t minted any cards yet. Visit the Inventory page to get started!
              </p>
              <button
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                onClick={() => {
                  console.log("Navigate to inventory page to mint cards");
                }}
              >
                Go to Inventory
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
