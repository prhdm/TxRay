import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { contractConfig } from '@/lib/contract';

export interface BalanceResult {
  balance: bigint | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBalance = (address?: `0x${string}`, tokenId: bigint = BigInt(0)): BalanceResult => {
  const { address: connectedAddress } = useAccount();

  // Use provided address or connected wallet address
  const targetAddress = address || connectedAddress;

  const {
    data: balance,
    isLoading,
    error,
    refetch
  } = useReadContract({
    ...contractConfig,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress, tokenId] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  // Debug logging (remove after fixing)
  console.log('Balance hook debug:', {
    targetAddress,
    balance,
    isLoading,
    error: error ? (error as Error).message : null,
    hasAddress: !!targetAddress
  });

  return {
    balance,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};

// Hook for getting the connected user's balance for a specific token ID
export const useUserBalance = (tokenId: bigint = BigInt(0)): BalanceResult => {
  const { address } = useAccount();

  return useBalance(address, tokenId);
};

// Hook for getting total balance across all token IDs (requires multiple calls)
export const useUserTotalBalance = (): BalanceResult => {
  const { address } = useAccount();
  
  // For now, just return balance for token ID 0
  // In a real implementation, you'd need to know all possible token IDs
  // or have a function that returns total balance across all tokens
  return useBalance(address, BigInt(0));
};

/*
Usage Examples:

// Get connected user's balance for token ID 0 (default)
const { balance, isLoading, error } = useUserBalance();

// Get connected user's balance for a specific token ID
const { balance, isLoading, error } = useUserBalance(1n);

// Get balance for a specific address and token ID
const { balance, isLoading, error } = useBalance('0x1234...', 0n);

// The balance is returned as a bigint, so you can format it:
const formattedBalance = balance ? balance.toString() : '0';

// For ERC1155, you typically need to know the token ID
// Common token IDs: 0, 1, 2, etc. (depends on your contract)

*/
