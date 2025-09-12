import { toast } from 'sonner';

// Toast utility functions for consistent messaging across the app
export const toastUtils = {
  // Success toasts
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  // Error toasts
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  // Info toasts
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  // Warning toasts
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    });
  },

  // Loading toast (returns dismiss function)
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Promise-based toast for async operations
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Dismiss all toasts
  dismiss: () => {
    toast.dismiss();
  },
};

// Specific toast messages for common operations
export const authToasts = {
  connecting: () => toastUtils.info('Connecting wallet...'),
  connected: (address: string) => toastUtils.success(
    'Wallet connected!',
    `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
  ),
  disconnected: () => toastUtils.info('Wallet disconnected'),
  networkSwitch: () => toastUtils.info('Switching network...'),
  networkSwitched: () => toastUtils.success('Network switched successfully'),
  signing: () => toastUtils.info('Please sign the message...'),
  signed: () => toastUtils.success('Message signed successfully'),
  authenticated: () => toastUtils.success('Authentication successful!'),
  authError: (error: string) => toastUtils.error('Authentication failed', error),
  logout: () => toastUtils.info('Logged out successfully'),
};

export const mintToasts = {
  minting: () => toastUtils.info('Minting in progress...'),
  minted: (rarity: number) => toastUtils.success(
    'Mint successful!',
    `Successfully minted rarity ${rarity} token`
  ),
  mintError: (error: string) => toastUtils.error('Mint failed', error),
  insufficientBalance: () => toastUtils.error(
    'Insufficient balance',
    'You need more tokens to mint'
  ),
  maxMintReached: () => toastUtils.warning(
    'Maximum mint limit reached',
    'You have reached your daily mint limit'
  ),
};

export const upgradeToasts = {
  upgrading: () => toastUtils.info('Upgrading token...'),
  upgraded: (fromRarity: number, toRarity: number) => toastUtils.success(
    'Upgrade successful!',
    `Token upgraded from rarity ${fromRarity} to ${toRarity}`
  ),
  upgradeError: (error: string) => toastUtils.error('Upgrade failed', error),
  insufficientTokens: () => toastUtils.error(
    'Insufficient tokens',
    'You need more tokens to upgrade'
  ),
};

export const contractToasts = {
  loading: () => toastUtils.info('Loading contract data...'),
  loaded: () => toastUtils.success('Contract data loaded'),
  loadError: (error: string) => toastUtils.error('Failed to load contract data', error),
  transactionPending: (hash: string) => toastUtils.info(
    'Transaction pending',
    `Hash: ${hash.slice(0, 10)}...`
  ),
  transactionSuccess: (hash: string) => toastUtils.success(
    'Transaction confirmed',
    `Hash: ${hash.slice(0, 10)}...`
  ),
  transactionError: (error: string) => toastUtils.error('Transaction failed', error),
};
