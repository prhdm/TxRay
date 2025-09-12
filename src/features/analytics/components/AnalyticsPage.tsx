"use client";

import {
  CollectionHeader,
} from "@/ui";
import { AnalyticsProvider } from "../lib/AnalyticsContext";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Collection Header - matching inventory page style */}
      <CollectionHeader
        title="Analytics"
        description="Real-time analytics for Rarity Collections. Track transactions, actions, activity and more."
      />

      {/* Analytics Dashboard */}
      <AnalyticsProvider>
        <AnalyticsDashboard />
      </AnalyticsProvider>
    </main>
  );
}
