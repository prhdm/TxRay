# Smart Contract Integration

This document explains the smart contract integration for minting functionality in TxRay.

## Overview

The minting functionality is integrated with a smart contract deployed at `0x0D99E3e638844020056C7659Dbe657C4C67276af`. Users can mint new rarity cards by calling the `mint` function on this contract.

## Contract Details

- **Contract Address**: `0x0D99E3e638844020056C7659Dbe657C4C67276af`
- **Function**: `mint(address recipient, bytes signature)`
- **Public Phase**: Pass `0x00` for signature parameter

## Architecture

### Frontend Integration
- **Wagmi Hooks**: Used for contract interaction
- **Custom Hook**: `useMint` provides minting functionality
- **Transaction Management**: Handles loading states, errors, and success states
- **UI Feedback**: Real-time transaction status updates

### Smart Contract Interaction Flow
1. **User Authentication**: User must be authenticated (wallet connected)
2. **Mint Request**: User clicks the mint button
3. **Transaction Creation**: Contract call is prepared with user's address and `0x00` signature
4. **Wallet Confirmation**: User confirms transaction in their wallet
5. **Transaction Processing**: Transaction is sent to the blockchain
6. **Status Updates**: UI shows loading, success, or error states
7. **Completion**: User receives feedback on transaction result

## Implementation Details

### Contract Configuration

```typescript
// apps/web/src/lib/contract.ts
export const CONTRACT_ADDRESS = '0x0D99E3e638844020056C7659Dbe657C4C67276af' as Address;

export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```

### Custom Mint Hook

```typescript
// apps/web/src/hooks/useMint.ts
export const useMint = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = async (): Promise<MintResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected', isLoading: false };
    }

    // Always use 0x00 as requested
    const signature = '0x00';

    writeContract({
      ...contractConfig,
      functionName: 'mint',
      args: [address, signature],
    });

    return { success: true, isLoading: true };
  };

  return { mint, isLoading, error, hash, isSuccess, isConfirming };
};
```

### UI Integration

The mint button is integrated into the `CollectionHeader` component with the following features:

- **Loading State**: Shows spinner and "Minting..." text during transaction
- **Disabled State**: Button is disabled when user is not authenticated or transaction is in progress
- **Error Handling**: Displays error messages if transaction fails
- **Success Feedback**: Shows success message and transaction hash when completed

## Usage

### Basic Minting

```typescript
import { useMint } from '../hooks/useMint';
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated } = useAuth();
  const { mint, isLoading, error, isSuccess, hash } = useMint();

  const handleMint = async () => {
    if (!isAuthenticated) {
      console.error("User must be authenticated to mint");
      return;
    }

    try {
      const result = await mint();
      if (result.success) {
        console.log("Mint transaction initiated");
      } else {
        console.error("Mint failed:", result.error);
      }
    } catch (error) {
      console.error("Mint error:", error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleMint}
        disabled={isLoading || !isAuthenticated}
      >
        {isLoading ? "Minting..." : "Mint"}
      </button>
      
      {error && <div className="error">Error: {error}</div>}
      {isSuccess && <div className="success">Mint successful!</div>}
      {hash && <div>Transaction: {hash}</div>}
    </div>
  );
}
```

### CollectionHeader Integration

```typescript
<CollectionHeader
  title="Inventory"
  description="Manage your collection of rarity cards..."
  onMint={handleMint}
  isMinting={isLoading}
  isDisabled={!isAuthenticated}
/>
```

## Transaction States

### Loading States
- **Pending**: Transaction is being prepared
- **Confirming**: Transaction is waiting for blockchain confirmation
- **Processing**: Transaction is being mined

### Success States
- **Confirmed**: Transaction has been successfully mined
- **Hash Available**: Transaction hash is displayed for verification

### Error States
- **Wallet Not Connected**: User must connect wallet first
- **Transaction Failed**: Smart contract call failed
- **User Rejected**: User rejected the transaction in their wallet
- **Network Error**: Blockchain network issues

## Error Handling

The system handles various error scenarios:

1. **Authentication Errors**: User must be authenticated to mint
2. **Wallet Connection Errors**: Wallet must be connected
3. **Transaction Errors**: Smart contract call failures
4. **Network Errors**: Blockchain connectivity issues
5. **User Cancellation**: User rejects transaction

## Security Considerations

1. **Authentication Required**: Only authenticated users can mint
2. **Address Validation**: Recipient address is validated
3. **Signature Handling**: Public phase uses `0x0` signature as specified
4. **Transaction Verification**: All transactions are verified on-chain
5. **Error Boundaries**: Proper error handling prevents app crashes

## Customization

### Different Contract Phases

For different contract phases (e.g., whitelist phase), you can modify the signature parameter:

```typescript
// For whitelist phase with actual signature
const signature = userSignature; // Get from backend or user input

// For public phase (current implementation)
const signature = '0x00';
```

### Custom Contract Address

To use a different contract, update the configuration:

```typescript
// apps/web/src/lib/contract.ts
export const CONTRACT_ADDRESS = 'YOUR_NEW_CONTRACT_ADDRESS' as Address;
```

### Additional Contract Functions

To add more contract functions, extend the ABI:

```typescript
export const CONTRACT_ABI = [
  // Existing mint function
  {
    "inputs": [...],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // New function
  {
    "inputs": [...],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
```

## Testing

### Local Testing

1. **Connect Wallet**: Ensure wallet is connected to the correct network
2. **Authenticate**: Complete the SIWE authentication flow
3. **Test Minting**: Click the mint button and confirm transaction
4. **Verify Transaction**: Check transaction hash on block explorer

### Network Requirements

- **Ethereum Network**: Contract is deployed on Ethereum mainnet
- **Gas Fees**: Ensure wallet has sufficient ETH for gas fees
- **Network Connection**: Stable internet connection required

## Troubleshooting

### Common Issues

1. **"Wallet not connected"**
   - Ensure wallet is connected via RainbowKit
   - Check that wallet is on the correct network

2. **"Transaction failed"**
   - Check if contract is deployed and accessible
   - Verify user has sufficient gas fees
   - Ensure contract is in public phase

3. **"User rejected transaction"**
   - User cancelled transaction in wallet
   - Try again and confirm transaction

4. **"Network error"**
   - Check internet connection
   - Verify RPC endpoint is working
   - Try switching networks

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
console.log('Mint state:', { isLoading, error, isSuccess, hash });
```

## Production Considerations

1. **Gas Optimization**: Monitor gas usage and optimize if needed
2. **Error Monitoring**: Implement proper error tracking
3. **Transaction History**: Consider storing transaction history
4. **Rate Limiting**: Implement rate limiting if needed
5. **Analytics**: Track minting metrics and user behavior

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify wallet connection and network
3. Ensure contract is accessible and in correct phase
4. Test with a small transaction first
