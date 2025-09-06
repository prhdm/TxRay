'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge } from '@/ui'
import { X, Plus, Wallet } from 'lucide-react'
import { useAnalytics } from '@/lib/AnalyticsContext'

export function WalletFilter() {
  const { walletFilter, setWalletFilter, isAdmin, user } = useAnalytics()
  const [newWallet, setNewWallet] = useState('')

  const addWallet = () => {
    if (!newWallet.trim()) return

    const wallet = newWallet.trim().toLowerCase()
    if (!walletFilter.wallets.includes(wallet)) {
      setWalletFilter({
        ...walletFilter,
        wallets: [...walletFilter.wallets, wallet]
      })
    }
    setNewWallet('')
  }

  // Auto-add user's wallet for non-admin users
  useEffect(() => {
    if (!isAdmin && user?.wallet_address && !walletFilter.wallets.includes(user.wallet_address.toLowerCase())) {
      setWalletFilter({
        enabled: true,
        wallets: [user.wallet_address.toLowerCase()]
      })
    }
  }, [user?.wallet_address, isAdmin])

  const removeWallet = (wallet: string) => {
    // Don't allow non-admin users to remove their own wallet
    if (!isAdmin && user?.wallet_address && wallet === user.wallet_address.toLowerCase()) {
      return
    }

    setWalletFilter({
      ...walletFilter,
      wallets: walletFilter.wallets.filter(w => w !== wallet)
    })
  }

  const toggleFilter = () => {
    setWalletFilter({
      ...walletFilter,
      enabled: !walletFilter.enabled
    })
  }

  const clearAll = () => {
    setWalletFilter({
      wallets: [],
      enabled: false
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Filter
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Filter analytics by specific wallet addresses (Admin)"
            : "View analytics for your connected wallet"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable wallet filtering</span>
          <Button
            variant={walletFilter.enabled ? "default" : "outline"}
            size="sm"
            onClick={toggleFilter}
          >
            {walletFilter.enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {walletFilter.enabled && (
          <>
            {/* Add Wallet Input - Only for admins */}
            {isAdmin && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addWallet()}
                  className="flex-1"
                />
                <Button onClick={addWallet} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Wallet List */}
            {walletFilter.wallets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isAdmin ? 'Filtered Wallets' : 'Your Wallet'}
                  </span>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {walletFilter.wallets.map((wallet) => (
                    <Badge key={wallet} variant="secondary" className="flex items-center gap-1">
                      <span className="font-mono text-xs">
                        {wallet.slice(0, 6)}...{wallet.slice(-4)}
                      </span>
                      <button
                        onClick={() => removeWallet(wallet)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Stats */}
            <div className="text-sm text-muted-foreground">
              {isAdmin ? (
                walletFilter.wallets.length === 0 ? (
                  <p>Add wallet addresses to filter analytics by specific accounts</p>
                ) : (
                  <p>Filtering analytics for {walletFilter.wallets.length} wallet{walletFilter.wallets.length > 1 ? 's' : ''}</p>
                )
              ) : (
                <p>Viewing analytics for your connected wallet</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


