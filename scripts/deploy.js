const hre = require("hardhat");

async function main() {

  // Deploy ERC20Mock token
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const erc20Mock = await ERC20Mock.deploy("Goalz USD", "glzUSD");
  const erc20MockAddress = await erc20Mock.getAddress();
  console.log("ERC20Mock deployed to:", erc20MockAddress);
  
  // Deploy GoalzToken
  const Goalz = await hre.ethers.getContractFactory("Goalz");
  const goalz = await Goalz.deploy(erc20MockAddress);
  const goalzAddress = await goalz.getAddress();
  console.log("GoalzToken deployed to:", goalzAddress);

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
