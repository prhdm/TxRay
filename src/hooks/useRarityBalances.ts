import React from 'react';
import {useAccount, useReadContract} from 'wagmi';
import {contractConfig} from '@/lib/contract';

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
    const {address} = useAccount();
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
    const {address} = useAccount();

    // Use individual hooks for each rarity level (fixed number to avoid dynamic hooks)
    const rarity1 = useRarityBalance(1);
    const rarity2 = useRarityBalance(2);
    const rarity3 = useRarityBalance(3);
    const rarity4 = useRarityBalance(4);
    const rarity5 = useRarityBalance(5);
    const rarity6 = useRarityBalance(6);
    const rarity7 = useRarityBalance(7);
    const rarity8 = useRarityBalance(8);
    const rarity9 = useRarityBalance(9);
    const rarity10 = useRarityBalance(10);
    const rarity11 = useRarityBalance(11);
    const rarity12 = useRarityBalance(12);
    const rarity13 = useRarityBalance(13);

    const balanceCalls = React.useMemo(() => [
        rarity1, rarity2, rarity3, rarity4, rarity5, rarity6, rarity7, rarity8, rarity9, rarity10, rarity11, rarity12, rarity13
    ], [rarity1, rarity2, rarity3, rarity4, rarity5, rarity6, rarity7, rarity8, rarity9, rarity10, rarity11, rarity12, rarity13]);

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
                balance: balance as bigint | undefined,
                level: tokenId,
                canUpgrade: ((balance as bigint | undefined) ?? BigInt(0)) >= BigInt(2), // Can upgrade if we have 2 or more tokens
            };
        });
    }, [address, balances]);

    // Refetch function that calls refetch on all balance calls
    const refetch = React.useCallback(() => {
        // Use a more stable approach by calling refetch on the individual calls
        const calls = [rarity1, rarity2, rarity3, rarity4, rarity5, rarity6, rarity7, rarity8, rarity9, rarity10, rarity11, rarity12, rarity13];
        calls.forEach(call => call.refetch());
    }, []);

    return {
        rarities,
        isLoading,
        error,
        refetch,
    };
};