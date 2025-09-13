import {getDefaultConfig} from '@rainbow-me/rainbowkit';
import type {Config} from 'wagmi';

export const taikoHekla = {
    id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID!),
    name: 'Taiko Hekla',
    network: 'taiko-hekla',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        public: {http: [process.env.NEXT_PUBLIC_RPC_URL!]},
        default: {http: [process.env.NEXT_PUBLIC_RPC_URL!]},
    },
    blockExplorers: {
        default: {name: 'Taiko Hekla Explorer', url: process.env.NEXT_PUBLIC_EXPLORER_URL!},
    },
    testnet: true,
} as const;

export const config: Config = getDefaultConfig({
    appName: 'TxRay',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [
        taikoHekla,
    ],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
