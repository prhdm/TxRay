'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from '@/ui'

// Dynamically import components to avoid SSR issues
const AnalyticsProvider = dynamic(() => import('@/lib/AnalyticsContext').then(mod => ({ default: mod.AnalyticsProvider })), { ssr: false })
const AnalyticsDashboard = dynamic(() => import('@/features/analytics/components/AnalyticsDashboard').then(mod => ({ default: mod.AnalyticsDashboard })), { ssr: false })

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Analytics</h1>
          <p className="text-muted-foreground">
            Real-time analytics for Taiko Hekla blockchain transactions and smart contracts
          </p>
        </div>

        <Suspense fallback={
          <Card className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </Card>
        }>
          <AnalyticsProvider>
            <AnalyticsDashboard />
          </AnalyticsProvider>
        </Suspense>
      </div>
    </div>
  )
}

