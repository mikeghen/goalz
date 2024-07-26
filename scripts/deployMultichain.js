const hre = require("hardhat");

// Network configurations
const networkConfigs = {
  arbitrum: {
    USDC_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    WETH_ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    GELATO_AUTOMATE: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
  },
  base: {
    USDC_ADDRESS: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    WETH_ADDRESS: "0x4200000000000000000000000000000000000006",
    GELATO_AUTOMATE: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
  },
  baseSepolia: {
    USDC_ADDRESS: "0xB731ac0a6783D18A41156c930361D3aB62e77606",
    WETH_ADDRESS: "0xAa17431356ea6b50347dD740Bf6185A6129b7ed7",
    GELATO_AUTOMATE: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
  },
};

async function main() {

  // Get the network name
  const networkName = hre.network.name;

  if (!networkName || !networkConfigs[networkName]) {
    throw new Error(`Invalid or missing network name. Available networks: ${Object.keys(networkConfigs).join(", ")}`);
  }

  // Get the network configuration
  const { USDC_ADDRESS, WETH_ADDRESS, GELATO_AUTOMATE } = networkConfigs[networkName];

  // Get the deployer signer
  const [deployer] = await hre.ethers.getSigners();

  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy([USDC_ADDRESS, WETH_ADDRESS], GELATO_AUTOMATE);
  const goalzAddress = await goalz.getAddress();
  console.log(`Goalz deployed to ${networkName} network at:`, goalzAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});