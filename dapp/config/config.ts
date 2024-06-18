import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import {
  rainbowWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, rainbowWallet],
    },
  ],
  {
    appName: 'Goalz',
    projectId: 'Goalz',
  }
);

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    ...connectors
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}