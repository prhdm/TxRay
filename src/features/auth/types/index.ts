// Authentication types and interfaces

export interface AuthUser {
    id?: string;
    wallet_address?: string;
    username?: string | null;
    created_at?: string;
    role?: string;
    contractData?: {
        balances: Record<number, bigint>;
        mintCount: bigint;
        currentPhase: number;
    } | null;
}

export interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authFlowState: AuthFlowState;
    needsWalletConnection: boolean;
    authenticate: (address: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    resetAuthFlow: () => void;
    startConnectionAttempt: () => void;
    updateUser: (userData: Partial<AuthUser>) => void;
    refreshContractData: () => Promise<void>;
    fetchContractData: () => Promise<void>;
}

export type AuthFlowState =
    'idle'
    | 'connecting'
    | 'network_check'
    | 'network_switch'
    | 'signing'
    | 'authenticating'
    | 'completed';

export interface AuthState {
    hasValidToken: boolean;
    hasRefreshToken: boolean;
    tokenWalletAddress: string | null;
    connectedWalletAddress: string | null;
    needsWalletConnection: boolean;
    needsSIWE: boolean;
    canSilentAuth: boolean;
}

export interface UserSerializationUtils {
    serialize: (userData: any) => any;
    deserialize: (userData: any) => any;
}
