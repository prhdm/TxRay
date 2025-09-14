"use client";

import {CollectionHeader, RarityCard} from "@/ui";
import {useAuth} from "@/features/auth/lib/AuthContext";
import {useRarityBalances} from "@/hooks/useRarityBalances";
import {useNavigation} from "@/features/navigation/lib/NavigationContext";
import {useMemo, useState} from "react";
import {ChevronDown, ChevronUp} from "lucide-react";

export default function ProfilePage() {
    const {user, updateUser} = useAuth();
    const {rarities, isLoading: raritiesLoading} = useRarityBalances();
    const {setCurrentPage} = useNavigation();
    // Notification system disabled
    const [isAccountInfoExpanded, setIsAccountInfoExpanded] = useState(true);

    // Filter to only show user's owned cards (balance > 0)
    const userCards = rarities.filter(rarity => (rarity.balance ?? BigInt(0)) > BigInt(0));

    // Create only owned rarity cards (filter out cards with 0 balance)
    const ownedRarityCards = useMemo(() => {
        return rarities
            .filter(rarity => (rarity.balance ?? BigInt(0)) > BigInt(0))
            .map(rarity => ({
                id: rarity.level,
                rarity: `Rarity ${rarity.level}`,
                cardCount: Number(rarity.balance ?? BigInt(0)),
                variant: (["default", "primary", "dark"] as const)[(rarity.level - 1) % 3],
                isSpecial: rarity.level === 13, // Mark rarity 13 as special
            }));
    }, [rarities]);

    // Separate normal and special cards from owned cards only
    const normalCards = useMemo(() => ownedRarityCards.filter(card => !card.isSpecial), [ownedRarityCards]);
    const specialCards = useMemo(() => ownedRarityCards.filter(card => card.isSpecial), [ownedRarityCards]);

    // Calculate total cards for tooltip logic
    const totalCards = useMemo(() => {
        return rarities.reduce((sum, rarity) => sum + Number(rarity.balance ?? BigInt(0)), 0);
    }, [rarities]);

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Collection Header */}
            <CollectionHeader
                title="Profile"
                description=""
            />

            {/* Account Information Card */}
            <div
                className="mb-6 sm:mb-8 p-6 border border-[#191A23] shadow-[0px_5px_0px_#191A23] rounded-3xl sm:rounded-[45px] bg-[#B9FF66]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-black">Account Information</h2>
                    <button
                        onClick={() => setIsAccountInfoExpanded(!isAccountInfoExpanded)}
                        className="w-8 h-8 bg-white border border-[#191A23] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        {isAccountInfoExpanded ? (
                            <ChevronUp className="w-4 h-4 text-black"/>
                        ) : (
                            <ChevronDown className="w-4 h-4 text-black"/>
                        )}
                    </button>
                </div>

                <div className="border-t border-[#191A23] mb-4"></div>

                {isAccountInfoExpanded && (
                    <div className="space-y-4">
                        {/* Wallet Address Only */}
                        <div>
                            <label className="text-sm font-medium text-black/70">Wallet Address</label>
                            <p className="text-black font-mono text-sm mt-1 break-all">
                                {user?.wallet_address || "Not connected"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Collected Cards Header */}
            <div
                className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 w-full">
                {/* Title with background */}
                <div className="flex justify-center lg:justify-start w-full lg:w-auto">
                    <div className="inline-flex items-center px-4 py-2 rounded-lg bg-rarity-bg">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-black text-center lg:text-left whitespace-nowrap">
                            Collected Cards
                        </h2>
                    </div>
                </div>

                {/* Description */}
                <div className="flex justify-center lg:justify-start w-full lg:flex-1 lg:max-w-none">
                    <p className="text-xs sm:text-sm font-normal leading-relaxed text-black text-center lg:text-left w-full">
                        You own {userCards.length} different rarity types.
                    </p>
                </div>
            </div>

            {/* Rarity Cards */}
            <div className="space-y-6 sm:space-y-8">
                {raritiesLoading ? (
                    // Loading skeleton for rarity cards
                    <div className="space-y-6 sm:space-y-8">
                        {/* Normal cards grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            {Array.from({length: 6}).map((_, index) => (
                                <div key={index}
                                     className="rounded-3xl sm:rounded-[45px] border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-lg animate-pulse min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
                                    <div
                                        className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8 h-full">
                                        <div className="flex flex-col gap-4 sm:gap-6 w-full md:flex-1">
                                            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-32 sm:w-36"></div>
                                            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-36 sm:w-40"></div>
                                            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg w-40 sm:w-44"></div>
                                            <div
                                                className="h-12 sm:h-14 bg-gray-200 rounded-xl w-full max-w-[200px]"></div>
                                        </div>
                                        <div
                                            className="w-full md:max-w-[300px] lg:max-w-[350px] h-[200px] sm:h-[250px] md:h-[280px] lg:h-[320px] bg-gray-200 rounded-2xl flex-shrink-0"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Special card skeleton */}
                        <div
                            className="rounded-3xl sm:rounded-[45px] border border-gray-200 p-6 sm:p-8 lg:p-12 shadow-lg animate-pulse min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                            <div
                                className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 lg:gap-10 h-full">
                                <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 w-full md:flex-1">
                                    <div className="h-12 sm:h-16 lg:h-20 bg-gray-200 rounded-lg w-40 sm:w-48"></div>
                                    <div className="h-12 sm:h-16 lg:h-20 bg-gray-200 rounded-lg w-48 sm:w-56"></div>
                                    <div
                                        className="h-16 sm:h-20 lg:h-24 bg-gray-200 rounded-xl w-full max-w-[300px]"></div>
                                </div>
                                <div
                                    className="w-full md:max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] bg-gray-200 rounded-2xl flex-shrink-0"></div>
                            </div>
                        </div>
                    </div>
                ) : userCards.length > 0 ? (
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
                                        tokenId={rarity.id}
                                        hideUpgradeButton={true} // Hide upgrade button on profile page
                                        totalCards={totalCards}
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
                                    tokenId={rarity.id}
                                    isSpecial={true}
                                    hideUpgradeButton={true} // Hide upgrade button for rarity 13
                                    totalCards={totalCards}
                                    className="w-full"
                                />
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Cards Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            You haven&apos;t minted any cards yet. Visit the Inventory page to get started!
                        </p>
                        <button
                            className="relative px-6 py-2 border border-[#191A23] rounded-md bg-[#B9FF66] text-black font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 overflow-hidden group"
                            onClick={() => {
                                setCurrentPage('inventory');
                            }}
                        >
                            <div className="absolute inset-0 bg-[#B9FF66] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></div>
                            <span className="relative z-10">Go to Inventory</span>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
