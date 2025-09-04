"use client";

import { 
  CollectionHeader,
  RarityCard,
} from "@txray/ui";

export default function InventoryPage() {
  const rarityData = [
    {
      id: 1,
      rarity: "Rarity",
      rarityLevel: "x1.000",
      cardCount: 1,
      variant: "default" as const,
    },
    {
      id: 2,
      rarity: "Rarity",
      rarityLevel: "x1.000",
      cardCount: 2,
      variant: "primary" as const,
    },
    {
      id: 3,
      rarity: "Rarity",
      rarityLevel: "x1.000",
      cardCount: 1,
      variant: "dark" as const,
    },
    {
      id: 4,
      rarity: "Email Marketing",
      rarityLevel: "x1.000",
      cardCount: 2,
      variant: "default" as const,
    },
    {
      id: 5,
      rarity: "Content Creation",
      rarityLevel: "x1.000",
      cardCount: 1,
      variant: "primary" as const,
    },
    {
      id: 6,
      rarity: "Analytics and Tracking",
      rarityLevel: "x1.000",
      cardCount: 2,
      variant: "dark" as const,
    }
  ];

  const handleUpgrade = (id: number) => {
    console.log(`Upgrading rarity ${id}`);
    // Add your upgrade logic here
  };

  const handleMint = () => {
    console.log("Minting new card...");
    // Add your mint logic here
  };

  return (
    <main className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* Collection Header */}
      <CollectionHeader
        title="Inventory"
        description="Manage your collection of rarity cards. Mint, burn two and reach the Rarity #13 for 20x in-game multiplier. Combine this pass with Ape, Swell cards and staked Formula Ape to chase the full 170x power-up."
        onMint={handleMint}
      />

      {/* Rarity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rarityData.map((rarity) => (
          <RarityCard
            key={rarity.id}
            rarity={rarity.rarity}
            rarityLevel={rarity.rarityLevel}
            cardCount={rarity.cardCount}
            variant={rarity.variant}
            onUpgrade={() => handleUpgrade(rarity.id)}
            className="w-full"
          />
        ))}
      </div>
    </main>
  );
}
