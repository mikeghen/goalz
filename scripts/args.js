const hre = require("hardhat");
const NETWORK_ADDRESSES = require("../config/networkAddresses");

const network = hre.network.name;

if (!NETWORK_ADDRESSES[network]) {
  throw new Error(`No configuration found for network: ${network}`);
}

const { USDC, WETH, aUSDC, aWETH, GELATO_AUTOMATE, AAVE_LENDING_POOL } =
  NETWORK_ADDRESSES[network];

console.log(USDC, WETH, aUSDC, aWETH, GELATO_AUTOMATE, AAVE_LENDING_POOL);

module.exports = [
  [USDC, WETH],
  [aUSDC, aWETH],
  GELATO_AUTOMATE,
  AAVE_LENDING_POOL,
];
