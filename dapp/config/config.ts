import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi'
import { arbitrum, base, baseSepolia } from 'wagmi/chains'
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
  chains: [arbitrum, base, baseSepolia],
  connectors: [
    ...connectors
  ],
  transports: {
    [arbitrum.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}