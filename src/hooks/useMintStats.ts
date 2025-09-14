import React from 'react';
import {useAccount, useReadContract} from 'wagmi';
import {useQueryClient} from '@tanstack/react-query';
import {contractConfig} from '@/lib/contract';

export interface MintStats {
    totalMinted: number;
    totalSupply: number;
    totalBurned: number;
    availableToMint: number;
    userMintCount: number;
    userCanMint: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useMintStats = (): MintStats => {
    const {address} = useAccount();
    const queryClient = useQueryClient();
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

    // Get user's burn count
    const {
        data: userBurnCount,
        isLoading: isUserBurnCountLoading,
        error: userBurnCountError
    } = useReadContract({
        ...contractConfig,
        functionName: 'burnCount',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 60000, // Refetch every 60 seconds to reduce re-renders
        },
    });

    const totalMinted = mintGlobalCount ? Number(mintGlobalCount) : 0;
    const totalSupply = config && Array.isArray(config) && config[6] ? Number(config[6]) : 0; // maxMintCount is at index 6
    const userMintCountNum = userMintCount ? Number(userMintCount) : 0;
    const userBurnCountNum = userBurnCount ? Number(userBurnCount) : 0;

    // Extract mint factor and mint limit from config
    const restoreMintFactor = config && Array.isArray(config) && config[2] ? Number(config[2]) : 3; // restoreMintFactor is at index 2
    const mintLimit = config && Array.isArray(config) && config[7] ? Number(config[7]) : 6; // mintLimit is at index 7

    // Calculate available mints using the formula:
    // available = Lim + Lim * Floor(mintCount/mintFactor) - mintCount
    // Where:
    // - Lim = mintLimit (base available mints)
    // - mintFactor = restoreMintFactor (factor for bonus mints)
    // - mintCount = userBurnCount (tokens burned by user)
    const availableToMint = Math.max(0, mintLimit + mintLimit * Math.floor(userBurnCountNum / restoreMintFactor) - totalMinted);

    // Calculate how many tokens the user can mint based on their burn count
    // Formula: Lim + Lim * Floor(burnCount/mintFactor) - userMintCount
    // This gives the user's personal available mint slots based on their burns
    const userCanMint = Math.max(0, mintLimit + mintLimit * Math.floor(userBurnCountNum / restoreMintFactor) - userMintCountNum);

    const isLoading = isMintCountLoading || isConfigLoading || isUserMintCountLoading || isUserBurnCountLoading;
    const error = mintCountError?.message || configError?.message || userMintCountError?.message || userBurnCountError?.message || null;

    // Refetch function that invalidates all contract queries
    const refetch = React.useCallback(() => {
        console.log('Refetching mint stats...');
        // Invalidate all contract read queries to force refetch
        queryClient.invalidateQueries({
            queryKey: ['readContract'],
        });
    }, [queryClient]);

    return {
        totalMinted,
        totalSupply,
        totalBurned: userBurnCountNum, // Use user's burn count
        availableToMint,
        userMintCount: userMintCountNum,
        userCanMint,
        isLoading,
        error,
        refetch,
    };
};
