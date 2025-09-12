'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/ui'
import { Wallet } from 'lucide-react'
import { useAnalytics } from '@/features/analytics/lib/AnalyticsContext'

export function WalletFilter() {
  const { user } = useAnalytics()

  // Since there's only one wallet, show it directly
  const walletAddress = user?.wallet_address

  if (!walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to view analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please connect your wallet to see analytics data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Your Wallet
        </CardTitle>
        <CardDescription>
          Analytics for your connected wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Wallet Address</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </Badge>
          </div>
        </div>

        {/* Contract Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Contract Address</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {/* This would be your single contract address */}
              0x... (Single Contract)
            </Badge>
          </div>
        </div>

        {/* Status Info */}
        <div className="text-sm text-muted-foreground">
          <p>• Viewing analytics for your wallet transactions</p>
          <p>• All data is filtered for your single contract</p>
        </div>
      </CardContent>
    </Card>
  )
}


