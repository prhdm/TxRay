import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { useAccount } from 'wagmi';
import { contractConfig } from '../lib/contract';
import { taikoHekla } from '../lib/rainbowkit';

export interface MintResult {
  success: boolean;
  error?: string;
  hash?: string;
  isLoading: boolean;
}

export const useMint = () => {
  const { address, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { switchChain } = useSwitchChain();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset local loading state when transaction completes
  React.useEffect(() => {
    if (isSuccess || writeError) {
      setIsLoading(false);
    }
  }, [isSuccess, writeError]);

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

      // Check if we're on the correct chain
      if (chainId !== taikoHekla.id) {
        try {
          await switchChain({ chainId: taikoHekla.id });
        } catch (switchError) {
          const errorMessage = switchError instanceof Error ? switchError.message : 'Failed to switch chain';
          setError(errorMessage);
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
        gas: 300000n, // Increased gas limit
      });

      return {
        success: true,
        isLoading: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Minting failed';
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
    console.error('Mint write error:', writeError);
    setError(writeError.message);
  }

  return {
    mint,
    isLoading: isLoading || isPending || isConfirming,
    error: error || writeError?.message || null,
    hash,
    isSuccess,
    isConfirming,
  };
};
