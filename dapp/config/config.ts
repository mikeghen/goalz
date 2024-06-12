import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi'
import { mainnet, baseSepolia } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'
import {
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
} from '@rainbow-me/rainbowkit/wallets';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  {
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
  }
);

export const config = createConfig({
  chains: [mainnet, baseSepolia],
  connectors: [
    ...connectors
  ],
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}