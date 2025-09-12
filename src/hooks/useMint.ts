import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { contractConfig } from '@/lib/contract';
import { taikoHekla } from '@/lib/rainbowkit';
import { mintToasts, contractToasts } from '@/lib/toast';

export interface MintResult {
  success: boolean;
  error?: string | null;
  hash?: string;
  isLoading: boolean;
}

export interface MintHookResult {
  mint: () => Promise<MintResult>;
  isLoading: boolean;
  error: string | null;
  hash: `0x${string}` | undefined;
  isSuccess: boolean;
  isConfirming: boolean;
  refetch: () => void;
}

export const useMint = (): MintHookResult => {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { switchChain } = useSwitchChain();
  
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
      // Note: We don't know the rarity here, so we'll use a generic success message
      mintToasts.minted(0); // 0 indicates unknown rarity
      
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
        console.log('User cancelled mint transaction');
        setError(null);
      } else {
        // Real error - show toast and set error state
        contractToasts.transactionError(writeError.message);
        setError(writeError.message);
      }
    }
  }, [writeError]);

  const mint = async (): Promise<MintResult> => {
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
      mintToasts.minting();

      // Check if we're on the correct chain
      if (chainId !== taikoHekla.id) {
        try {
          await switchChain({ chainId: taikoHekla.id });
        } catch (switchError) {
          const errorMessage = switchError instanceof Error ? switchError.message : 'Failed to switch chain';
          setError(errorMessage);
          mintToasts.mintError(errorMessage);
          return {
            success: false,
            error: errorMessage,
            isLoading: false,
          };
        }
      }

      // Always use 0x00 as requested
      const signature = '0x00';

      // Call the mint function
      console.log('Minting with params:', {
        recipient: address,
        signature: signature,
        contractAddress: contractConfig.address
      });

      writeContract({
        ...contractConfig,
        functionName: 'mint',
        args: [address, signature],
        gas: BigInt(300000), // Increased gas limit
      });

      return {
        success: true,
        isLoading: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Minting failed';
      
      // Check if this is a user cancellation
      if (isUserCancellation(err)) {
        console.log('User cancelled mint transaction');
        setError(null);
        return {
          success: false,
          error: null,
          isLoading: false,
        };
      }
      
      setError(errorMessage);
      mintToasts.mintError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        isLoading: false,
      };
    }
  };


  // Refetch function that invalidates all contract queries
  const refetch = React.useCallback(() => {
    console.log('Refetching mint data...');
    queryClient.invalidateQueries({
      queryKey: ['readContract'],
    });
  }, [queryClient]);

  return {
    mint,
    isLoading: isLoading || isPending || isConfirming,
    error: error || (writeError && !isUserCancellation(writeError) ? writeError.message : null),
    hash,
    isSuccess,
    isConfirming,
    refetch,
  };
};
