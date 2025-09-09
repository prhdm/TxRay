import { useReadContract, useAccount } from 'wagmi';
import { contractConfig } from '@/lib/contract';

export interface MintStats {
  totalMinted: number;
  totalSupply: number;
  totalBurned: number;
  availableToMint: number;
  userMintCount: number;
  userCanMint: number;
  isLoading: boolean;
  error: string | null;
}

export const useMintStats = (): MintStats => {
  const { address } = useAccount();

  // Get total minted count
  const { 
    data: mintGlobalCount, 
    isLoading: isMintCountLoading, 
    error: mintCountError 
  } = useReadContract({
    ...contractConfig,
    functionName: 'mintGlobalCount',
    query: {
      refetchInterval: 60000, // Refetch every 60 seconds to reduce re-renders
    },
  });

  // Get contract config which includes maxMintCount (total supply)
  const { 
    data: config, 
    isLoading: isConfigLoading, 
    error: configError 
  } = useReadContract({
    ...contractConfig,
    functionName: 'config',
    query: {
      refetchInterval: 120000, // Refetch every 2 minutes (config changes less frequently)
    },
  });

  // Get user's mint count
  const { 
    data: userMintCount, 
    isLoading: isUserMintCountLoading, 
    error: userMintCountError 
  } = useReadContract({
    ...contractConfig,
    functionName: 'mintCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 60000, // Refetch every 60 seconds to reduce re-renders
    },
  });

  const totalMinted = mintGlobalCount ? Number(mintGlobalCount) : 0;
  const totalSupply = config ? Number(config[6]) : 0; // maxMintCount is at index 6
  const userMintCountNum = userMintCount ? Number(userMintCount) : 0;
  
  // Calculate total burned: totalMinted - currentSupply
  // Since we can't easily get current supply, we'll use totalSupply as the limit
  // and calculate burns as: totalMinted - (totalSupply - availableToMint)
  // For now, let's assume burns = totalMinted - totalSupply (if totalMinted > totalSupply)
  const totalBurned = Math.max(0, totalMinted - totalSupply);
  
  // Calculate available mints using the new formula:
  // available = Math.max(0, 5 + 5*Math.floor(totalBurn/3) - totalMint)
  // This means:
  // - Base available mints: 5
  // - Bonus mints: 5 for every 3 tokens burned (5 * Math.floor(totalBurn/3))
  // - Subtract total minted to get remaining available
  // - Ensure result is never negative
  const availableToMint = Math.max(0, 5 + 5 * Math.floor(totalBurned / 3) - totalMinted);
  
  // Calculate how many tokens the user can mint
  // If they've minted 5, they need to burn 3 to mint again
  // So they can mint: 5 - (userMintCount % 5) tokens
  const userCanMint = userMintCountNum >= 5 ? 0 : 5 - userMintCountNum;
  
  const isLoading = isMintCountLoading || isConfigLoading || isUserMintCountLoading;
  const error = mintCountError?.message || configError?.message || userMintCountError?.message || null;

  return {
    totalMinted,
    totalSupply,
    totalBurned,
    availableToMint,
    userMintCount: userMintCountNum,
    userCanMint,
    isLoading,
    error,
  };
};
