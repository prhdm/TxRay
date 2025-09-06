# Wallet-Based Authentication with Supabase

This document explains the wallet-based authentication system implemented in TxRay using Sign-In with Ethereum (SIWE) and Supabase.

## Overview

The authentication flow works as follows:

1. **Wallet Connection**: User connects their wallet using RainbowKit
2. **Message Signing**: User signs a SIWE message to prove wallet ownership
3. **Backend Verification**: Backend verifies the signature and creates/updates user in Supabase
4. **Session Management**: Frontend receives session tokens and manages authentication state

## Architecture

### Frontend (Web App)
- **RainbowKit**: Wallet connection UI
- **Wagmi**: Ethereum interaction hooks
- **SIWE**: Sign-In with Ethereum message creation and verification
- **Supabase Client**: Session management and user state
- **Auth Context**: React context for authentication state management

### Backend (API)
- **Express.js**: API server
- **SIWE**: Message verification
- **Supabase**: User storage and session management
- **JWT**: Custom session tokens (optional)

## Setup Instructions

### 1. Environment Variables

#### Web App (`apps/web/.env.local`)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
# API URL no longer needed - using Supabase Edge Functions

# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### API (`apps/api/.env`)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database migration**:
   ```sql
   -- Execute the SQL from supabase-migrations/001_create_users_table.sql
   ```

3. **Get your Supabase credentials**:
   - Project URL
   - Anon key
   - Service role key

### 3. WalletConnect Setup

1. **Create a WalletConnect project** at [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. **Get your Project ID** and add it to your environment variables

## File Structure

```
apps/
├── web/
│   ├── src/lib/
│   │   ├── auth.ts              # SIWE authentication utilities
│   │   └── supabase.ts          # Supabase client configuration
│   ├── app/contexts/
│   │   └── AuthContext.tsx      # Authentication React context
│   └── app/components/
│       └── rarity-collection.tsx # Main app component with auth integration
├── api/
│   └── src/
│       ├── routes/
│       │   └── auth.ts          # SIWE authentication endpoint
│       └── index.ts             # API server setup
└── packages/ui/
    └── src/
        └── header.tsx           # Header with wallet connection
```

## Authentication Flow

### 1. Wallet Connection
```typescript
// User clicks "Connect Wallet" button
// RainbowKit opens wallet selection modal
// User selects and connects their wallet
```

### 2. SIWE Authentication
```typescript
// When wallet connects, onAuthenticated callback is triggered
const handleAuthenticated = async (address: string) => {
  try {
    // Create SIWE message
    const siweMessage = await createSiweMessage(address, window.location.host, chainId);
    const messageToSign = siweMessage.prepareMessage();
    
    // Sign message with wallet
    const signature = await signMessageAsync({ message: messageToSign });
    
    // Send to backend for verification
    const result = await authenticateWithSupabase(address, signature, messageToSign);
    
    if (result.success) {
      // User is now authenticated
      console.log('Authentication successful!');
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};
```

### 3. Backend Verification
```typescript
// Backend receives: { address, signature, message }
// 1. Verifies SIWE message signature
// 2. Checks if user exists in Supabase
// 3. Creates new user if doesn't exist
// 4. Returns session tokens
```

## Usage Examples

### Check Authentication Status
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (isAuthenticated) {
    return <div>Welcome, {user.wallet_address}!</div>;
  }
  
  return <div>Please connect your wallet</div>;
}
```

### Sign Out
```typescript
import { useAuth } from '../contexts/AuthContext';

function SignOutButton() {
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };
  
  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Security Considerations

1. **Message Verification**: All SIWE messages are verified on the backend
2. **Address Validation**: Wallet addresses are normalized and validated
3. **Session Management**: Sessions are managed securely through Supabase
4. **CORS Configuration**: API is configured with proper CORS settings
5. **Environment Variables**: Sensitive data is stored in environment variables

## Customization

### Custom Chain Support
Update the chain configuration in `apps/web/src/lib/rainbowkit.ts`:

```typescript
export const customChain = {
  id: YOUR_CHAIN_ID,
  name: 'Your Chain Name',
  network: 'your-network',
  nativeCurrency: {
    decimals: 18,
    name: 'Your Token',
    symbol: 'YOUR',
  },
  rpcUrls: {
    public: { http: ['https://your-rpc-url.com'] },
    default: { http: ['https://your-rpc-url.com'] },
  },
  blockExplorers: {
    default: { name: 'Your Explorer', url: 'https://your-explorer.com' },
  },
  testnet: true,
} as const;
```

### Custom SIWE Message
Modify the message creation in `apps/web/src/lib/auth.ts`:

```typescript
export const createSiweMessage = async (
  address: string,
  domain: string,
  chainId: number,
  statement: string = 'Your custom sign-in message'
): Promise<SiweMessage> => {
  // Custom message configuration
};
```

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure all required environment variables are set
   - Check that `.env.local` file exists in the web app directory

2. **"Authentication failed"**
   - Verify Supabase credentials are correct
   - Check that the API server is running
   - Ensure the users table exists in Supabase

3. **"Wallet connection failed"**
   - Verify WalletConnect Project ID is correct
   - Check that the wallet supports message signing

### Debug Mode
Enable debug logging by adding to your environment:
```env
DEBUG=true
```

## Production Deployment

1. **Set up production Supabase project**
2. **Configure production environment variables**
3. **Deploy API server with proper CORS settings**
4. **Update frontend API URL to production endpoint**
5. **Test authentication flow in production environment**

## Support

For issues or questions:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase project is properly configured
4. Test with a simple wallet connection first
