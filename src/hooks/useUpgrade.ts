import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { contractConfig } from '@/lib/contract';

export interface UpgradeResult {
  success: boolean;
  error?: string | null;
  hash?: string;
  isLoading: boolean;
}

export const useUpgrade = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

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
      return {
        success: false,
        error: errorMessage,
        isLoading: false,
      };
    }
  };

  // Handle write contract errors
  if (writeError && !isUserCancellation(writeError)) {
    console.error('Upgrade write error:', writeError);
    setError(writeError.message);
  } else if (writeError && isUserCancellation(writeError)) {
    // User cancelled - don't show error, just reset state
    console.log('User cancelled upgrade transaction');
    setError(null);
  }

  return {
    upgrade,
    isLoading: isLoading || isPending || isConfirming,
    error: error || (writeError && !isUserCancellation(writeError) ? writeError.message : null),
    hash,
    isSuccess,
    isConfirming,
  };
};
