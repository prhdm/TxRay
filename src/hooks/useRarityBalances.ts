import React from 'react';
import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { contractConfig } from '@/lib/contract';

export interface RarityBalance {
  tokenId: number;
  balance: bigint | undefined;
  level: number;
  canUpgrade: boolean;
}

export interface RarityBalancesResult {
  rarities: RarityBalance[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Custom hook for a single rarity balance
const useRarityBalance = (tokenId: number) => {
  const { address } = useAccount();
  return useReadContract({
    ...contractConfig,
    functionName: 'balanceOf' as const,
    args: address ? [address, BigInt(tokenId)] : undefined,
    query: {
      enabled: !!address,
    },
  });
};

export const useRarityBalances = (): RarityBalancesResult => {
  const { address } = useAccount();
  
  // Use individual hooks for each rarity level (fixed number to avoid dynamic hooks)
  const rarity1 = useRarityBalance(1);
  const rarity2 = useRarityBalance(2);
  const rarity3 = useRarityBalance(3);
  const rarity4 = useRarityBalance(4);
  const rarity5 = useRarityBalance(5);

  const balanceCalls = [rarity1, rarity2, rarity3, rarity4, rarity5];

  // Extract data from all calls
  const balances = balanceCalls.map(call => call.data ?? BigInt(0));
  const isLoading = balanceCalls.some(call => call.isLoading);
  const errors = balanceCalls.map(call => call.error).filter(Boolean);
  const error = errors.length > 0 ? (errors[0] as Error).message : null;

  // Transform the data into the expected format
  const rarities: RarityBalance[] = React.useMemo(() => {
    if (!address) {
      return [];
    }

    return balances.map((balance, index) => {
      const tokenId = index + 1;

      return {
        tokenId,
        balance,
        level: tokenId,
        canUpgrade: (balance ?? BigInt(0)) >= BigInt(2), // Can upgrade if we have 2 or more tokens
      };
    });
  }, [address, balances]);

  // Refetch function that calls refetch on all balance calls
  const refetch = React.useCallback(() => {
    balanceCalls.forEach(call => call.refetch());
  }, [rarity1, rarity2, rarity3, rarity4, rarity5]);

  return {
    rarities,
    isLoading,
    error,
    refetch,
  };
};