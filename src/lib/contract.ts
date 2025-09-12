import { Address } from 'viem';
import { CONTRACT_ABI } from './contract-abi';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as Address;

export { CONTRACT_ABI };

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const;
