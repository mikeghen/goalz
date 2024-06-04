const hre = require("hardhat");

const GELATO_AUTOMATE = "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0";

// Previously deployed USDC and WETH addresses
const USDC_ADDRESS = "0x46CF2f301760F8B83B6eBBFedd0BC3b8358e577B";
const WETH_ADDRESS = "0x60357BaeF1130e24ee5007D0662d0e98183DC72C";

async function main() {
  // Get the deployer signer
  const [deployer] = await hre.ethers.getSigners();

  // Deploy ERC20Mock token
  // const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  // const usdc = await ERC20Mock.deploy("USD Coin", "USDC");
  // const usdcAddress = await usdc.getAddress();
  // console.log("Mock USDC deployed to:", usdcAddress);

  // Get the USDC contract at
  const usdc = await hre.ethers.getContractAt("ERC20Mock", USDC_ADDRESS);
  const usdcAddress = await usdc.getAddress();

  console.log("USDC deployed to:", usdcAddress);

  // // Sleep for 10 seconds
  // console.log("Sleeping for 10 seconds...");
  // await new Promise((r) => setTimeout(r, 20000));

  // Mint 1000 USDC to deployer
  let tx = await usdc.mint(await deployer.getAddress(), hre.ethers.parseEther("1000"));
  await tx.wait();
  console.log("Minted 1000 Mock USDC to deployer");

  // const weth = await ERC20Mock.deploy("Wrapped Ether", "WETH");
  // const wethAddress = await weth.getAddress();
  // console.log("Mock WETH deployed to:", wethAddress);

  // Get the WETH contract at
  const weth = await hre.ethers.getContractAt("ERC20Mock", WETH_ADDRESS);
  const wethAddress = await weth.getAddress();
  console.log("WETH deployed to:", wethAddress);
  
  // // Sleep for 10 seconds
  // console.log("Sleeping for 10 seconds...");
  // await new Promise((r) => setTimeout(r, 20000));
  
  // Mint 2 WETH to deployer
  tx = await weth.mint(await deployer.getAddress(), hre.ethers.parseEther("2"));
  await tx.wait();
  console.log("Minted 2 Mock WETH to deployer");

  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy([usdcAddress, wethAddress], GELATO_AUTOMATE);
  const goalzAddress = await goalz.getAddress();
  console.log("Goalz deployed to:", goalzAddress);

  // Sleep for 10 seconds
  console.log("Sleeping for 10 seconds...");

  const glzUSDCAddress = await goalz.goalzTokens(usdcAddress);
  console.log("Goalz USDC deployed to:", glzUSDCAddress);

  const glzWETHAddress = await goalz.goalzTokens(wethAddress);
  console.log("Goalz WETH deployed to:", glzWETHAddress);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
