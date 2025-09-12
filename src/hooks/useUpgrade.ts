import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { contractConfig } from '@/lib/contract';
import { upgradeToasts, contractToasts } from '@/lib/toast';

export interface UpgradeResult {
  success: boolean;
  error?: string | null;
  hash?: string;
  isLoading: boolean;
}

export interface UpgradeHookResult {
  upgrade: (fromTokenId: number, toTokenId: number) => Promise<UpgradeResult>;
  isLoading: boolean;
  error: string | null;
  hash: `0x${string}` | undefined;
  isSuccess: boolean;
  isConfirming: boolean;
  refetch: () => void;
}

export const useUpgrade = (): UpgradeHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Helper function to check if error is user cancellation
  const isUserCancellation = (error: any): boolean => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('user rejected') ||
      message.includes('user denied') ||
      message.includes('user cancelled') ||
      message.includes('user canceled') ||
      message.includes('rejected') ||
      message.includes('denied') ||
      message.includes('cancelled') ||
      message.includes('canceled') ||
      message.includes('action rejected') ||
      message.includes('transaction was rejected')
    );
  };

  // Reset local loading state when transaction completes
  React.useEffect(() => {
    if (isSuccess || writeError) {
      setIsLoading(false);
    }
  }, [isSuccess, writeError]);

  // Handle transaction success
  React.useEffect(() => {
    if (isSuccess && hash) {
      contractToasts.transactionSuccess(hash);
      // Note: We don't know the exact rarity here, so we'll use generic success message
      upgradeToasts.upgraded(0, 0); // 0 indicates unknown rarity
      
      // Invalidate all contract queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['readContract'],
      });
    }
  }, [isSuccess, hash, queryClient]);

  // Handle transaction errors
  React.useEffect(() => {
    if (writeError) {
      if (isUserCancellation(writeError)) {
        // User cancelled - don't show error, just reset state
        console.log('User cancelled upgrade transaction');
        setError(null);
      } else {
        // Real error - show toast and set error state
        contractToasts.transactionError(writeError.message);
        setError(writeError.message);
      }
    }
  }, [writeError]);

  const upgrade = async (fromTokenId: number, toTokenId: number): Promise<UpgradeResult> => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected',
        isLoading: false,
      };
    }

    try {
      setIsLoading(true);
      setError(null);
      upgradeToasts.upgrading();

      console.log(`Upgrading from Rarity ${fromTokenId} to Rarity ${toTokenId}`);

      // Use the contract's upgradeTokenTo function
      writeContract({
        ...contractConfig,
        functionName: 'upgradeTokenTo',
        args: [BigInt(toTokenId)], // Pass the target token ID (next level)
      });

      // The upgradeTokenTo function handles burning 2 tokens of (tokenId-1)
      // and minting 1 token of tokenId automatically

      return {
        success: true,
        isLoading: true,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upgrade failed';
      
      // Check if this is a user cancellation
      if (isUserCancellation(err)) {
        console.log('User cancelled upgrade transaction');
        setError(null);
        return {
          success: false,
          error: null,
          isLoading: false,
        };
      }
      
      setError(errorMessage);
      upgradeToasts.upgradeError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        isLoading: false,
      };
    }
  };


  // Refetch function that invalidates all contract queries
  const refetch = React.useCallback(() => {
    console.log('Refetching upgrade data...');
    queryClient.invalidateQueries({
      queryKey: ['readContract'],
    });
  }, [queryClient]);

  return {
    upgrade,
    isLoading: isLoading || isPending || isConfirming,
    error: error || (writeError && !isUserCancellation(writeError) ? writeError.message : null),
    hash,
    isSuccess,
    isConfirming,
    refetch,
  };
};
