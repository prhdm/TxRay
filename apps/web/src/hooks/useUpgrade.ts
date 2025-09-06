import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { contractConfig } from '../lib/contract';

export interface UpgradeResult {
  success: boolean;
  error?: string;
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
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        isLoading: false,
      };
    }
  };

  // Handle write contract errors
  if (writeError) {
    console.error('Upgrade write error:', writeError);
    setError(writeError.message);
  }

  return {
    upgrade,
    isLoading: isLoading || isPending || isConfirming,
    error: error || writeError?.message || null,
    hash,
    isSuccess,
    isConfirming,
  };
};
