import {AuthUser} from '../types';

/**
 * Utility functions for serializing and deserializing user data to/from localStorage
 */

/**
 * Safely serialize user data for localStorage (converts BigInt to string)
 */
export const serializeUserData = (userData: AuthUser | null): any => {
    if (!userData) return userData;

    // Convert BigInt values to strings for JSON serialization
    const serialized = JSON.parse(JSON.stringify(userData, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return value;
    }));

    return serialized;
};

/**
 * Deserialize user data from localStorage (converts string back to BigInt)
 */
export const deserializeUserData = (userData: any): AuthUser | null => {
    if (!userData) return userData;

    // Convert string values back to BigInt where needed
    if (userData.contractData) {
        const {balances, mintCount, ...rest} = userData.contractData;

        // Convert balance strings back to BigInt
        const deserializedBalances: Record<number, bigint> = {};
        if (balances) {
            Object.entries(balances).forEach(([key, value]) => {
                deserializedBalances[Number(key)] = BigInt(value as string);
            });
        }

        return {
            ...userData,
            contractData: {
                ...rest,
                balances: deserializedBalances,
                mintCount: mintCount ? BigInt(mintCount as string) : 0n,
            }
        };
    }

    return userData;
};
