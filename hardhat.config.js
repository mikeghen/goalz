require("@nomicfoundation/hardhat-toolbox");
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
    hardhat: {
      forking: {
        url: process.env.MAINNET_NODE_URL || "",
        accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        enabled: true,
      },
    },
    // tenderly: {
    //   url: process.env.TENDERLY_NODE_URL,
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    //   // 84531 is the network ID of the Tenderly Mainnet fork (Base Goerli)
    // },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN
  }
};