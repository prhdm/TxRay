"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle, CollectionHeader,} from "@/ui";
import {AnalyticsProvider} from "../lib/AnalyticsContext";
import {AnalyticsDashboard} from "./AnalyticsDashboard";
import {useAuth} from "@/features/auth/lib/AuthContext";

export default function AnalyticsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {isAuthenticated, user, authFlowState} = useAuth();

    // Debug logging for analytics authentication
    console.log('AnalyticsPage render:', {
        isAuthenticated,
        hasUser: !!user,
        userWalletAddress: user?.wallet_address,
        authFlowState
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // The actual refresh logic is handled in AnalyticsDashboard
        // This just manages the loading state for the button
        setTimeout(() => setIsRefreshing(false), 200);
    };

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Collection Header - matching inventory page style */}
            <CollectionHeader
                title="Analytics"
                description="Real-time analytics for Rarity Collections. Track transactions, actions, activity and more."
                onMint={handleRefresh}
                isMinting={isRefreshing}
                isDisabled={!isAuthenticated}
                buttonText="Refresh"
                loadingText="Refreshing..."
                showRefreshIcon={true}
            />

            {/* Analytics Dashboard */}
            {(isAuthenticated && user?.wallet_address) ? (
                <AnalyticsProvider>
                    <AnalyticsDashboard
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                    />
                </AnalyticsProvider>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <h2 className="text-2xl font-medium text-foreground/60 mb-4">
                        Connect Your Wallet
                    </h2>
                    <p className="text-muted-foreground/60 max-w-md">
                        You have to connect your wallet to see the analytics
                    </p>
                </div>
            )}
        </main>
    );
}
