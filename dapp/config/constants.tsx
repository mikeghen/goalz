import ERC20 from './abis/ERC20.json'
import GOALZ from './abis/GOALZ.json'
import { arbitrum, base, baseSepolia } from 'wagmi/chains'

export const ERC20_ABI = ERC20
export const GOALZ_ABI = GOALZ

const networkAddresses = {
  [arbitrum.id]: {
    USDC_ADDRESS: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
    WETH_ADDRESS: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum WETH
    GOALZ_USDC_ADDRESS: '0x...', // Replace with actual Arbitrum address
    GOALZ_WETH_ADDRESS: '0x...', // Replace with actual Arbitrum address
    GOALZ_ADDRESS: '0x...', // Replace with actual Arbitrum address
  },
  [base.id]: {
    USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
    GOALZ_USDC_ADDRESS: '0xbce33106991d18CAad8c655DB79617b7be424084',
    GOALZ_WETH_ADDRESS: '0x1fD2FC732e38B33bc282Ce248e948d6c3108f237',
    GOALZ_ADDRESS: '0x8afc985f3C23DdcA21B70Ecc65B3570d265AaeCf',
  },
  [baseSepolia.id]: {
    USDC_ADDRESS: '0xB731ac0a6783D18A41156c930361D3aB62e77606',
    WETH_ADDRESS: '0xAa17431356ea6b50347dD740Bf6185A6129b7ed7',
    GOALZ_USDC_ADDRESS: '0x27c8c8117fa4c0e0648e0e03173914bd0af9c094',
    GOALZ_WETH_ADDRESS: '0x0781d037c268ff1f78104425eee8aac42f58556a',
    GOALZ_ADDRESS: '0x5059dF9ab4D462D7Acc3d2057fbe56F009323591',
  },
}

export const getNetworkAddresses = (chainId: number) => {
  const addresses = networkAddresses[chainId]
  if (!addresses) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  return addresses
}

export const SUPPORTED_CHAIN_IDS = Object.keys(networkAddresses).map(Number)