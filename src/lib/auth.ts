import {SiweMessage} from 'siwe';
import {useAccount, useSignMessage, useSwitchChain} from 'wagmi';

// Types
export interface AuthResult {
    success: boolean;
    error?: string;
    user?: {
        id: string;
        wallet_address: string;
        role?: string;
    };
}

export interface AuthUser {
    id: string;
    wallet_address: string;
    role?: string;
}

// Constants
const TAIKO_HEKLA_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID!);
const ACCESS_TOKEN_EXPIRY_BUFFER = 90; // Refresh 90 seconds before expiry

// Global auth state
let accessToken: string | null = null;
let tokenExpiry: number | null = null;
let refreshPromise: Promise<string> | null = null;
let csrfToken: string | null = null;

// Initialize tokens from localStorage on module load
const initializeTokens = () => {
    if (typeof window !== 'undefined') {
        try {
            const storedToken = localStorage.getItem('txray_access_token');
            const storedExpiry = localStorage.getItem('txray_token_expiry');

            if (storedToken && storedExpiry) {
                const expiryTime = parseInt(storedExpiry);
                // Only restore if token hasn't expired
                if (Date.now() < expiryTime) {
                    accessToken = storedToken;
                    tokenExpiry = expiryTime;
                    console.log('Restored access token from localStorage');
                } else {
                    // Clear expired tokens
                    localStorage.removeItem('txray_access_token');
                    localStorage.removeItem('txray_token_expiry');
                    console.log('Cleared expired tokens from localStorage');
                }
            }
        } catch (error) {
            console.error('Error initializing tokens from localStorage:', error);
        }
    }
};

// Initialize tokens when module loads
initializeTokens();

// Helper function to persist tokens to localStorage
const persistTokens = (token: string, expiry: number) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('txray_access_token', token);
            localStorage.setItem('txray_token_expiry', expiry.toString());
        } catch (error) {
            console.error('Error persisting tokens to localStorage:', error);
        }
    }
};

// Helper function to clear tokens from localStorage
const clearPersistedTokens = () => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('txray_access_token');
            localStorage.removeItem('txray_token_expiry');
        } catch (error) {
            console.error('Error clearing tokens from localStorage:', error);
        }
    }
};

/**
 * Get Supabase function URL
 */
const getSupabaseUrl = () => {
    // Use the deployed Supabase edge functions
    return process.env.NEXT_PUBLIC_SUPABASE_URL!;
};

/**
 * Get CSRF token from server
 */
export const getCsrfToken = async (): Promise<string> => {
    if (csrfToken) return csrfToken;

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');

    const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${anonKey}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    csrfToken = data.csrf;
    return csrfToken!;
};

/**
 * Get request headers with CSRF token
 */
const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getCsrfToken();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY not configured');

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'X-CSRF-Token': token,
    };
};

/**
 * Get nonce from server
 */
export const getNonce = async (address: string): Promise<string> => {
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/nonce`, {
        method: 'POST',
        headers: await getHeaders(),
        credentials: 'include',
        body: JSON.stringify({address}),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get nonce');
    }

    const data = await response.json();
    return data.nonce;
};

/**
 * Create SIWE message
 */
export const createSiweMessage = async (
    address: string,
    nonce: string
): Promise<SiweMessage> => {
    const message = new SiweMessage({
        domain: window.location.hostname,
        address,
        statement: 'Sign in with Ethereum to TxRay',
        uri: window.location.origin,
        version: '1',
        chainId: TAIKO_HEKLA_CHAIN_ID,
        nonce,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    return message;
};

/**
 * Authenticate with SIWE
 */
export const authenticateWithSIWE = async (
    address: string,
    signature: string,
    message: string
): Promise<AuthResult> => {
    try {
        const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/siwe-verify`, {
            method: 'POST',
            headers: await getHeaders(),
            credentials: 'include',
            body: JSON.stringify({address, message, signature}),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Authentication failed',
            };
        }

        // Store access token
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
        if (accessToken) {
            persistTokens(accessToken, tokenExpiry);
        }

        return {
            success: true,
            user: data.user,
        };
    } catch (error) {
        console.error('SIWE authentication error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
        };
    }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
    // Prevent multiple concurrent refresh requests
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/refresh`, {
                method: 'POST',
                headers: await getHeaders(),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Refresh failed');
            }

            accessToken = data.access_token;
            tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
            if (accessToken) {
                persistTokens(accessToken, tokenExpiry);
            }

            return accessToken || '';
        } catch (error) {
            console.error('Token refresh error:', error);
            // Clear tokens on refresh failure
            accessToken = null;
            tokenExpiry = null;
            clearPersistedTokens();
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Parse JWT token to extract payload
 */
export const parseJWT = (token: string): any => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
};

/**
 * Extract wallet address from email in token payload
 * Email format: wallet_address@wallet.local
 */
export const getWalletAddressFromEmail = (email: string): string | null => {
    if (!email || typeof email !== 'string') {
        return null;
    }

    // Check if email follows the pattern: address@wallet.local
    if (!email.endsWith('@wallet.local')) {
        return null;
    }

    // Extract address part before @wallet.local
    const address = email.split('@wallet.local')[0];

    // Basic validation for Ethereum address format
    if (address && address.length === 42 && address.startsWith('0x')) {
        return address;
    }

    return null;
};

/**
 * Get wallet address from access token (tries both direct wallet_address and email)
 */
export const getWalletAddressFromToken = async (): Promise<string | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    const payload = parseJWT(token);
    if (!payload) return null;

    // Try direct wallet_address field first
    if (payload.wallet_address) {
        return payload.wallet_address;
    }

    // Try extracting from email field
    if (payload.email) {
        return getWalletAddressFromEmail(payload.email);
    }

    return null;
};

/**
 * Check if token is valid (not expired)
 */
export const isTokenValid = (): boolean => {
    return !!accessToken && !!tokenExpiry && Date.now() < tokenExpiry;
};

/**
 * Check if refresh token exists in cookies
 */
export const hasRefreshToken = (): boolean => {
    if (typeof window === 'undefined') return false;

    const cookies = document.cookie.split(';');
    return cookies.some(cookie => cookie.trim().startsWith('__Host-rt='));
};

/**
 * Comprehensive authentication state check
 */
export const getAuthState = async (): Promise<{
    hasValidToken: boolean;
    hasRefreshToken: boolean;
    tokenWalletAddress: string | null;
    connectedWalletAddress: string | null;
    needsWalletConnection: boolean;
    needsSIWE: boolean;
    canSilentAuth: boolean;
}> => {
    const hasValidTokenResult = isTokenValid();
    const hasRefreshTokenResult = hasRefreshToken();
    const tokenWalletAddress = hasValidTokenResult ? await getWalletAddressFromToken() : null;

    // Get connected wallet address from wagmi
    const connectedWalletAddress: string | null = null;
    try {
        // Dynamic import to avoid issues in SSR
        const {useAccount} = await import('wagmi');
        // Note: This won't work in a non-React context, needs to be called from a React component
        // We'll handle this in the AuthContext
    } catch {
        // Ignore errors for now, this will be handled in React context
    }

    return {
        hasValidToken: hasValidTokenResult,
        hasRefreshToken: hasRefreshTokenResult,
        tokenWalletAddress,
        connectedWalletAddress,
        needsWalletConnection: !!tokenWalletAddress && !connectedWalletAddress,
        needsSIWE: !hasValidTokenResult && !hasRefreshTokenResult,
        canSilentAuth: hasRefreshTokenResult && !hasValidTokenResult
    };
};


/**
 * Refresh user's contract data (useful after minting or other contract interactions)
 */
export const refreshUserContractData = async (): Promise<{
    balances: Record<number, bigint>;
    mintCount: bigint;
    currentPhase: number;
} | null> => {
    const walletAddress = await getWalletAddressFromToken();
    if (!walletAddress) {
        console.error('No wallet address found in token');
        return null;
    }

    return fetchUserContractData(walletAddress);
};

/**
 * Fetch user's smart contract data after authentication
 */
export const fetchUserContractData = async (walletAddress: string): Promise<{
    balances: Record<number, bigint>;
    mintCount: bigint;
    currentPhase: number;
} | null> => {
    try {
        console.log('Fetching contract data for wallet:', walletAddress);

        // Import contract utilities dynamically to avoid circular dependencies
        const {createPublicClient, http} = await import('viem');
        const {taikoHekla} = await import('./rainbowkit');
        const {CONTRACT_ADDRESS, CONTRACT_ABI} = await import('./contract');

        const client = createPublicClient({
            chain: taikoHekla,
            transport: http(),
        });

        // Fetch user's balances for all rarity levels (1-13)
        const balancePromises = [];
        for (let rarity = 1; rarity <= 13; rarity++) {
            balancePromises.push(
                client.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress as `0x${string}`, BigInt(rarity)],
                })
            );
        }

        // Fetch user's mint count
        const mintCountPromise = client.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'mintCount',
            args: [walletAddress as `0x${string}`],
        });

        // Fetch current phase
        const currentPhasePromise = client.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'currentPhase',
        });

        // Wait for all contract calls to complete
        const [balances, mintCount, currentPhase] = await Promise.all([
            Promise.all(balancePromises),
            mintCountPromise,
            currentPhasePromise,
        ]);

        // Convert balances to a more usable format
        const balanceMap: Record<number, bigint> = {};
        balances.forEach((balance: any, index: number) => {
            balanceMap[index + 1] = balance as bigint;
        });

        const contractData = {
            balances: balanceMap,
            mintCount: mintCount as bigint,
            currentPhase: Number(currentPhase),
        };

        console.log('Contract data fetched successfully:', contractData);
        return contractData;

    } catch (error) {
        console.error('Failed to fetch contract data:', error);
        return null;
    }
};

/**
 * Get current access token (refreshes if needed)
 */
export const getAccessToken = async (): Promise<string | null> => {
    if (!accessToken) return null;

    // Check if token is close to expiry
    if (tokenExpiry && Date.now() > (tokenExpiry - ACCESS_TOKEN_EXPIRY_BUFFER * 1000)) {
        try {
            await refreshAccessToken();
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return null;
        }
    }

    return accessToken;
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
    try {
        await fetch(`${getSupabaseUrl()}/functions/v1/auth/logout`, {
            method: 'POST',
            headers: await getHeaders(),
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        accessToken = null;
        tokenExpiry = null;
        csrfToken = null;
        clearPersistedTokens();
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!accessToken && !!tokenExpiry && Date.now() < tokenExpiry;
};

/**
 * Check if we have valid tokens for silent reconnection
 */
export const hasValidTokens = async (): Promise<boolean> => {
    try {
        // Check if we have a refresh token cookie
        const cookies = document.cookie.split(';');
        const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('__Host-rt='));

        if (!refreshTokenCookie) {
            return false;
        }

        // Try to refresh the token to see if it's still valid
        const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/refresh`, {
            method: 'POST',
            headers: await getHeaders(),
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token;
            tokenExpiry = Date.now() + (15 * 60 * 1000);
            if (accessToken) {
                persistTokens(accessToken, tokenExpiry);
            }
            return true;
        }
    } catch (error) {
        console.error('Token validation failed:', error);
    }
    return false;
};

/**
 * Silent reconnection - reconnect wallet without SIWE if tokens are valid
 */
export const silentReconnect = async (address: string): Promise<AuthResult> => {
    try {
        const hasValidTokensResult = await hasValidTokens();

        if (hasValidTokensResult && accessToken) {
            // We have valid tokens, get the actual user data
            try {
                const userData = await bootstrapAuth();
                if (userData) {
                    return {
                        success: true,
                        user: userData,
                    };
                }
            } catch (error) {
                console.error('Failed to get user data during silent reconnect:', error);
            }

            // If we can't get user data, fall back to full SIWE
            return {
                success: false,
                error: 'Valid tokens found but could not retrieve user data',
            };
        }

        // No valid tokens, return failure so full SIWE flow can proceed
        return {
            success: false,
            error: 'No valid tokens found, full authentication required',
        };
    } catch (error) {
        console.error('Silent reconnection failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Silent reconnection failed',
        };
    }
};

/**
 * Bootstrap auth on app start
 */
export const bootstrapAuth = async (): Promise<AuthUser | null> => {
    try {
        // First get CSRF token
        await getCsrfToken();

        const response = await fetch(`${getSupabaseUrl()}/functions/v1/auth/refresh`, {
            method: 'POST',
            headers: await getHeaders(),
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token;
            tokenExpiry = Date.now() + (15 * 60 * 1000);
            if (accessToken) {
                persistTokens(accessToken, tokenExpiry);
            }
            return data.user;
        }
    } catch (error) {
        console.error('Auth bootstrap failed:', error);
    }
    return null;
};

/**
 * Hook for wallet-based authentication
 */
export const useWalletAuth = () => {
    const {signMessageAsync} = useSignMessage();
    const {chainId} = useAccount();
    const {switchChain} = useSwitchChain();

    const authenticate = async (address: string): Promise<AuthResult> => {
        try {
            if (!signMessageAsync) {
                return {
                    success: false,
                    error: 'Wallet not connected or sign message not available',
                };
            }

            // Check if we need to switch chains
            if (chainId !== TAIKO_HEKLA_CHAIN_ID) {
                return {
                    success: false,
                    error: 'CHAIN_SWITCH_REQUIRED',
                };
            }

            // Get nonce
            const nonce = await getNonce(address);

            // Create and sign SIWE message
            const siweMessage = await createSiweMessage(address, nonce);
            const messageToSign = siweMessage.prepareMessage();

            const signature = await signMessageAsync({
                message: messageToSign,
            });

            // Authenticate
            return await authenticateWithSIWE(address, signature, messageToSign);
        } catch (error) {
            console.error('Wallet authentication error:', error);

            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            const isUserCancellation =
                errorMessage.includes('User rejected') ||
                errorMessage.includes('User denied') ||
                errorMessage.includes('User cancelled') ||
                errorMessage.includes('User canceled') ||
                errorMessage.includes('rejected') ||
                errorMessage.includes('denied') ||
                errorMessage.includes('cancelled') ||
                errorMessage.includes('canceled') ||
                errorMessage.includes('4001') ||
                errorMessage.includes('ACTION_REJECTED');

            return {
                success: false,
                error: isUserCancellation ? 'User cancelled authentication' : errorMessage,
            };
        }
    };

    const switchToTaikoHekla = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            if (!switchChain) {
                return {
                    success: false,
                    error: 'Chain switching not available',
                };
            }

            await switchChain({chainId: TAIKO_HEKLA_CHAIN_ID});
            return {success: true};
        } catch (error) {
            console.error('Chain switch error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to switch chain';
            const isUserCancellation =
                errorMessage.includes('User rejected') ||
                errorMessage.includes('User denied') ||
                errorMessage.includes('User cancelled') ||
                errorMessage.includes('User canceled') ||
                errorMessage.includes('rejected') ||
                errorMessage.includes('denied') ||
                errorMessage.includes('cancelled') ||
                errorMessage.includes('canceled') ||
                errorMessage.includes('4001') ||
                errorMessage.includes('ACTION_REJECTED');

            return {
                success: false,
                error: isUserCancellation ? 'User cancelled chain switch' : errorMessage,
            };
        }
    };

    return {
        authenticate,
        switchToTaikoHekla,
        silentReconnect,
        logout,
        isAuthenticated,
        getAccessToken,
    };
};
