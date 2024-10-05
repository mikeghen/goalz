const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Deposit & Savings", function () {
  let Goalz;
  let goalz;
  let ERC20Mock;
  let MockAaveToken;
  let usdc;
  let weth;
  let aUSDC;
  let aWETH;
  let usdcAddress;
  let wethAddress;
  let aUSDCAddress;
  let aWETHAddress;
  let goalzUSD;
  let goalzETH;
  let deployer;
  let user1;
  let user2;
  let automatoor;
  let mockGelato;
  let mockLendingPool;
  let tokenTracking;

  const targetAmount = ethers.parseEther("10");
  const targetDate = Math.floor(Date.now() / 1000) + 86400 * 1000; // 100 days from now
  const depositAmount = ethers.parseEther("5");
  const automatedDepositAmount = ethers.parseEther("2");
  const automatedDepositFrequency = 3600; // 1 hour
  const interestRatePerSecond = ethers.parseEther("0.000000001"); // Approx 3% APY

  async function deployGoalzFixture() {
    [deployer, user1, user2, automatoor] = await ethers.getSigners();

    // Deploy mock contracts
    const MockGelato = await ethers.getContractFactory("MockGelato");
    mockGelato = await MockGelato.deploy();

    const MockLendingPool = await ethers.getContractFactory("MockLendingPool");
    mockLendingPool = await MockLendingPool.deploy();

    // Deploy mock tokens
    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    usdc = await ERC20Mock.deploy("USD Coin", "USDC");
    weth = await ERC20Mock.deploy("Wrapped Ether", "WETH");
    usdcAddress = await usdc.getAddress();
    wethAddress = await weth.getAddress();

    // Deploy aTokens
    MockAaveToken = await ethers.getContractFactory("MockAaveToken");
    aUSDC = await MockAaveToken.deploy("Aave USD Coin", "aUSDC", interestRatePerSecond);
    aWETH = await MockAaveToken.deploy("Aave Wrapped Ether", "aWETH", interestRatePerSecond);
    aUSDCAddress = await aUSDC.getAddress();
    aWETHAddress = await aWETH.getAddress();

    // Set up MockLendingPool
    await mockLendingPool.setAToken(usdcAddress, aUSDCAddress);
    await mockLendingPool.setAToken(wethAddress, aWETHAddress);

    // Deploy Goalz contract
    Goalz = await ethers.getContractFactory("Goalz");
    goalz = await Goalz.deploy(
      [usdcAddress, wethAddress],
      [aUSDCAddress, aWETHAddress],
      await mockGelato.getAddress(),
      await mockLendingPool.getAddress()
    );

    // Get GoalzToken contracts
    goalzUSD = await ethers.getContractAt("GoalzToken", await goalz.goalzTokens(usdcAddress));
    goalzETH = await ethers.getContractAt("GoalzToken", await goalz.goalzTokens(wethAddress));
    
    const TokenTracking = await ethers.getContractFactory("TokenTracking");
    tokenTracking = await TokenTracking.deploy(usdcAddress, wethAddress);

    // Mint tokens to users
    await usdc.mint(user1.address, ethers.parseEther("1000"));
    await usdc.mint(user2.address, ethers.parseEther("1000"));
    await weth.mint(user1.address, ethers.parseEther("1000"));
    await weth.mint(user2.address, ethers.parseEther("1000"));

    // Approve Goalz contract to spend user tokens
    await usdc.connect(user1).approve(await goalz.getAddress(), ethers.MaxUint256);
    await usdc.connect(user2).approve(await goalz.getAddress(), ethers.MaxUint256);
    await weth.connect(user1).approve(await goalz.getAddress(), ethers.MaxUint256);
    await weth.connect(user2).approve(await goalz.getAddress(), ethers.MaxUint256);

    // // Fast forward time
    // await ethers.provider.send("evm_increaseTime", [86400]);
    // await ethers.provider.send("evm_mine");
    
    return { goalz, usdc, weth, aUSDC, aWETH, goalzUSD, goalzETH, mockLendingPool, tokenTracking };
  }

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      const { goalz, goalzUSD, goalzETH } = await loadFixture(deployGoalzFixture);
      
      expect(await goalz.name()).to.equal("Goalz");
      expect(await goalz.symbol()).to.equal("GOALZ");
      expect(await goalzUSD.name()).to.equal("Goalz USD Coin");
      expect(await goalzUSD.symbol()).to.equal("glzUSDC");
      expect(await goalzETH.name()).to.equal("Goalz Wrapped Ether");
      expect(await goalzETH.symbol()).to.equal("glzWETH");
    });
  });

  // describe("Token Tracking", function () {
  //   it("should get transaction info", async function () {
  //     const { goalz, usdc, goalzUSD, aUSDC, tokenTracking } = await loadFixture(deployGoalzFixture);
  //     await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      
  //     const userBalanceBefore = await usdc.balanceOf(user1.address);
  //     const goalzBalanceBefore = await usdc.balanceOf(await goalz.getAddress());
  //     const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

  //     await expect(goalz.connect(user1).deposit(0, depositAmount))
  //       .to.emit(goalz, "DepositMade")
  //       .withArgs(user1.address, 0, depositAmount);

  //     const userBalanceAfter = await usdc.balanceOf(user1.address);
  //     const goalzBalanceAfter = await usdc.balanceOf(await goalz.getAddress());
  //     const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
      
  //   });
  // });

  describe("Deposits", function () {
    it("should get information about a deposit transaction", async function () {
      const { goalz, usdc, goalzUSD, aUSDC, tokenTracking } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Car", "Buy a BMW with twin turbo mods", targetAmount, targetDate, usdcAddress);

      await expect(goalz.connect(user1).deposit(0, depositAmount))
        .to.emit(goalz, "DepositMade")
        .withArgs(user1.address, 0, depositAmount);

      await tokenTracking.deposit(depositAmount, user1);
      const history1 = await tokenTracking.history(user1.address, 1);

      expect(history1.token).to.equal(wethAddress);
      expect(history1.amount).to.equal(depositAmount);
      expect(history1.eventType).to.equal("deposit");

    });
  });

  describe("Savings", function () {
    it("should get information about a savings transaction", async function () {
      const { goalz, usdc, goalzUSD, aUSDC, tokenTracking } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Car", "Buy a BMW with twin turbo mods", targetAmount, targetDate, usdcAddress);

      await expect(goalz.connect(user1).deposit(0, depositAmount))
        .to.emit(goalz, "DepositMade")
        .withArgs(user1.address, 0, depositAmount);

      await tokenTracking.saving(depositAmount, user1);
      const history1 = await tokenTracking.history(user1.address, 1);

      expect(history1.token).to.equal(usdcAddress);
      expect(history1.amount).to.equal(depositAmount);
      expect(history1.eventType).to.equal("saving");

    });
  });
});