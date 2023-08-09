const hre = require("hardhat");

async function main() {

  // Deploy ERC20Mock token
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const usdc = await ERC20Mock.deploy("USD Coin", "USDC");
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  const weth = await ERC20Mock.deploy("Wrapped Ether", "WETH");
  const wethAddress = await weth.getAddress();
  console.log("Mock WETH deployed to:", wethAddress);
  
  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy([usdcAddress, wethAddress]);
  const goalzAddress = await goalz.getAddress();
  console.log("Goalz deployed to:", goalzAddress);

  const glzUSDCAddress = await goalz.goalzTokens(usdcAddress);
  console.log("Goalz USDC deployed to:", glzUSDCAddress);

  const glzWETHAddress = await goalz.goalzTokens(wethAddress);
  console.log("Goalz WETH deployed to:", glzWETHAddress);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
