const hre = require("hardhat");

// Base Mainnet
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const GELATO_AUTOMATE = "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0"

async function main() {
  // Get the deployer signer
  const [deployer] = await hre.ethers.getSigners();

  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy([USDC_ADDRESS, WETH_ADDRESS], GELATO_AUTOMATE);
  const goalzAddress = await goalz.getAddress();
  console.log("Goalz deployed to:", goalzAddress);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
