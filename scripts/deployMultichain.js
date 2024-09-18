const hre = require("hardhat");
const { ethers } = hre;
const NETWORK_ADDRESSES = require("../config/networkAddresses");

async function main() {
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());

  // Get the current network
  const network = hre.network.name;
  console.log("Deploying to network:", network);

  // Ensure we have addresses for the current network
  if (!NETWORK_ADDRESSES[network]) {
    throw new Error(`No configuration found for network: ${network}`);
  }

  const {
    USDC,
    WETH,
    aUSDC,
    aWETH,
    AAVE_LENDING_POOL,
    GELATO_AUTOMATE
  } = NETWORK_ADDRESSES[network];

  // Check if all required addresses are available
  if (!USDC || !WETH || !aUSDC || !aWETH || !AAVE_LENDING_POOL) {
    throw new Error(`Missing required address for network: ${network}. Please update the networkAddresses.js configuration.`);
  }

  // Deploy Goalz contract
  const Goalz = await ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy(
    [USDC, WETH],
    [aUSDC, aWETH],
    GELATO_AUTOMATE,
    AAVE_LENDING_POOL
  );

  await goalz.deployed();
  console.log("Goalz deployed to:", goalz.address);

  // Get GoalzToken addresses
  const glzUSDCAddress = await goalz.goalzTokens(USDC);
  const glzWETHAddress = await goalz.goalzTokens(WETH);

  console.log("Goalz USDC token deployed to:", glzUSDCAddress);
  console.log("Goalz WETH token deployed to:", glzWETHAddress);

  // Verify contracts on Etherscan
  if (network !== "hardhat" && network !== "localhost") {
    console.log("Verifying contracts on Etherscan...");
    await verifyContracts(goalz.address, USDC, WETH, aUSDC, aWETH, AAVE_LENDING_POOL);
  }

  console.log("Deployment completed successfully!");
}

async function verifyContracts(goalzAddress, USDC, WETH, aUSDC, aWETH, AAVE_LENDING_POOL) {
  try {
    await hre.run("verify:verify", {
      address: goalzAddress,
      constructorArguments: [
        [USDC, WETH],
        [aUSDC, aWETH],
        GELATO_AUTOMATE,
        AAVE_LENDING_POOL
      ],
    });

    console.log("Contract verification completed successfully");
  } catch (error) {
    console.error("Error during contract verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });