"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CollectionHeader } from "@/ui";
import { AnalyticsProvider } from "../lib/AnalyticsContext";
import { GlobalAnalyticsDashboard } from "./GlobalAnalyticsDashboard";

export default function GlobalAnalyticsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // The actual refresh logic is handled in GlobalAnalyticsDashboard
        setTimeout(() => setIsRefreshing(false), 200);
    };

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Collection Header - matching inventory page style */}
            <CollectionHeader
                title="Global Analytics"
                description="Real-time analytics for all Rarity Collections activity. Track total transactions, gas usage, and network activity across all wallets."
                onMint={handleRefresh}
                isMinting={isRefreshing}
                buttonText="Refresh"
                loadingText="Refreshing..."
                showRefreshIcon={true}
            />

            {/* Global Analytics Dashboard */}
            <AnalyticsProvider>
                <GlobalAnalyticsDashboard
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />
            </AnalyticsProvider>
        </main>
    );
}
