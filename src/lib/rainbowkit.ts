import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Config } from 'wagmi';

export const taikoHekla = {
  id: 167009,
  name: 'Taiko Hekla',
  network: 'taiko-hekla',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.hekla.taiko.xyz'] },
    default: { http: ['https://rpc.hekla.taiko.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Taiko Hekla Explorer', url: 'https://hekla.taikoscan.io' },
  },
  testnet: true,
} as const;

export const config: Config = getDefaultConfig({
  appName: 'TxRay',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'ca48ea50367099fab3ea554817737035', // TODO: MOVE THIS TO .ENV
  chains: [
    taikoHekla,
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
