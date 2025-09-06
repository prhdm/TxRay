import React from 'react';
import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { contractConfig } from '../lib/contract';

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

export const useRarityBalances = (maxRarity: number = 10): RarityBalancesResult => {
  const { address } = useAccount();

  // Use individual contract calls for each token ID
  const balanceCalls = Array.from({ length: maxRarity }, (_, i) => {
    const tokenId = i + 1;
    return useReadContract({
      ...contractConfig,
      functionName: 'balanceOf' as const,
      args: address ? [address, BigInt(tokenId)] : undefined,
      query: {
        enabled: !!address,
      },
    });
  });

  // Extract data from all calls
  const balances = balanceCalls.map(call => call.data ?? 0n);
  const isLoading = balanceCalls.some(call => call.isLoading);
  const errors = balanceCalls.map(call => call.error).filter(Boolean);
  const error = errors.length > 0 ? (errors[0] as Error).message : null;

  // Store refetch functions separately to avoid dependency issues
  const refetchFunctions = React.useMemo(() =>
    balanceCalls.map(call => call.refetch),
    [balanceCalls]
  );

  // Debug logging
  console.log('Rarity Balances Debug:', {
    address,
    balances: balances.map(b => b.toString()),
    error,
    isLoading,
    contractAddress: contractConfig.address,
  });

  // Process the balances into rarity data
  const rarities: RarityBalance[] = Array.from({ length: maxRarity }, (_, i) => {
    const tokenId = i + 1;
    const balance = balances[i];

    // Debug each token
    if (tokenId <= 5) { // Only log first 5 for less noise
      console.log(`Token ${tokenId}:`, {
        balance: balance?.toString() ?? 'undefined',
        address,
        contractAddress: contractConfig.address,
      });
    }

    return {
      tokenId,
      balance,
      level: tokenId,
      canUpgrade: (balance ?? 0n) >= 2n, // Can upgrade if we have 2 or more tokens
    };
  });

  // Refetch function that calls refetch on all balance calls
  const refetch = React.useCallback(() => {
    refetchFunctions.forEach(refetchFn => refetchFn());
  }, [refetchFunctions]);

  return {
    rarities,
    isLoading,
    error,
    refetch,
  };
};
