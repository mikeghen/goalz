require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // hardhat: {
    //   forking: {
    //     url: process.env.MAINNET_NODE_URL || "",
    //     accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    //     enabled: true,
    //   },
    // },
    tenderly: {
      url: process.env.TENDERLY_NODE_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: process.env.TENDERLY_CHAIN_ID ? parseInt(process.env.TENDERLY_CHAIN_ID) : 1,
    },
    arbitrum: {
      url: process.env.ARBITRUM_NODE_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_NODE_URL || "https://sepolia.basescan.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
    base: {
      url: process.env.BASE_NODE_URL || "",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
  },
  etherscan: {
    apiKey: {
      "arbitrum": process.env.ARBISCAN_API_KEY,
      "base": process.env.BASESCAN_API_KEY,
      "base-sepolia": process.env.BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
         apiURL: "https://api.arbiscan.io/api",
         browserURL: "https://arbiscan.io"
        }
      },
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
         apiURL: "https://api-sepolia.basescan.org/api",
         browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
         apiURL: "https://api.basescan.org/api",
         browserURL: "https://basescan.org"
        }
      }
    ]
  },
};