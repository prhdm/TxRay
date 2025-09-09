import { Address } from 'viem';
import contractAbi from './contract-abi.json';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS! as Address;

export const CONTRACT_ABI = contractAbi;

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const;
