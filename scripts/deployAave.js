const hre = require("hardhat");
const networkAddresses = require("../config/networkAddresses.js");

async function main() {
  // Get the network-specific addresses
  const network = hre.network.name;
  const addresses = networkAddresses[network];

  if (!addresses) {
    throw new Error(`No addresses found for network: ${network}`);
  }

  // Use addresses from the imported module
  const { USDC, WETH, AAVE_LENDING_POOL, aUSDC, aWETH, GELATO_AUTOMATE } =
    addresses;

  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy(
    [USDC, WETH],
    [aUSDC, aWETH],
    GELATO_AUTOMATE,
    AAVE_LENDING_POOL
  );
  const goalzAddress = await goalz.getAddress();
  console.log("Goalz deployed to:", goalzAddress);

  // Sleep for 10 seconds
  console.log("Sleeping for 10 seconds...");
  await new Promise((r) => setTimeout(r, 10000));

  const glzUSDCAddress = await goalz.goalzTokens(USDC);
  console.log("Goalz USDC deployed to:", glzUSDCAddress);

  const glzWETHAddress = await goalz.goalzTokens(WETH);
  console.log("Goalz WETH deployed to:", glzWETHAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
