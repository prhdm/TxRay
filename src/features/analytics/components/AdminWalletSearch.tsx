'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge } from '@/ui'
import { Search, Plus, Users } from 'lucide-react'
import { useAnalytics } from '@/lib/AnalyticsContext'

export function AdminWalletSearch() {
  const { searchWallets, addWalletToFilter } = useAnalytics()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchWallets(searchQuery.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddWallet = (wallet: string) => {
    addWalletToFilter(wallet)
    setSearchResults(prev => prev.filter(w => w !== wallet))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Admin Wallet Search
        </CardTitle>
        <CardDescription>
          Search for specific wallet addresses to add to analytics filter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter wallet address or partial address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Search Results</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((wallet) => (
                <div key={wallet} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-mono text-sm">
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddWallet(wallet)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Status */}
        {isSearching && (
          <p className="text-sm text-muted-foreground">Searching...</p>
        )}

        {!isSearching && searchQuery && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground">No wallets found</p>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>• Search by full wallet address or partial match</p>
          <p>• Added wallets will appear in the filter above</p>
        </div>
      </CardContent>
    </Card>
  )
}
