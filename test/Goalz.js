const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Goalz", function () {
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

  const targetAmount = ethers.parseEther("10");
  const targetDate = Math.floor(Date.now() / 1000) + 86400 * 100; // 100 days from now
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

    return { goalz, usdc, weth, aUSDC, aWETH, goalzUSD, goalzETH, mockLendingPool };
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

  describe("Goal Creation and Management", function () {
    it("should create a new savings goal", async function () {
      const { goalz } = await loadFixture(deployGoalzFixture);
      
      await expect(goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress))
        .to.emit(goalz, "GoalCreated")
        .withArgs(user1.address, 0, "Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress, anyValue);

      const goal = await goalz.savingsGoals(0);
      expect(goal.what).to.equal("Vacation");
      expect(goal.why).to.equal("For a dream vacation");
      expect(goal.targetAmount).to.equal(targetAmount);
      expect(goal.targetDate).to.equal(targetDate);
      expect(goal.currentAmount).to.equal(0);
      expect(goal.depositToken).to.equal(usdcAddress);
    });

    it("should not create a goal with invalid parameters", async function () {
      const { goalz } = await loadFixture(deployGoalzFixture);
      
      await expect(goalz.setGoal("Vacation", "For a dream vacation", 0, targetDate, usdcAddress))
        .to.be.revertedWith("Target amount should be greater than 0");

      await expect(goalz.setGoal("Vacation", "For a dream vacation", targetAmount, Math.floor(Date.now() / 1000) - 1, usdcAddress))
        .to.be.revertedWith("Target date should be in the future");
    });

    it("should delete a goal", async function () {
      const { goalz } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      
      await expect(goalz.connect(user1).deleteGoal(0))
        .to.emit(goalz, "GoalDeleted")
        .withArgs(user1.address, 0);

      const goal = await goalz.savingsGoals(0);
      expect(goal.what).to.equal("");
      expect(goal.targetAmount).to.equal(0);
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("should deposit funds into a savings goal", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      
      const userBalanceBefore = await usdc.balanceOf(user1.address);
      const goalzBalanceBefore = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

      await expect(goalz.connect(user1).deposit(0, depositAmount))
        .to.emit(goalz, "DepositMade")
        .withArgs(user1.address, 0, depositAmount);

      const userBalanceAfter = await usdc.balanceOf(user1.address);
      const goalzBalanceAfter = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
      // const aUSDCBalance = await aUSDC.balanceOf(await goalz.getAddress());

      expect(userBalanceAfter).to.equal(userBalanceBefore - depositAmount);
      expect(goalzBalanceAfter).to.equal(goalzBalanceBefore);
      expect(goalzUSDBalanceAfter).to.equal(goalzUSDBalanceBefore + depositAmount);
      // expect(aUSDCBalance).to.equal(depositAmount);
    });

    it("should withdraw funds from a savings goal", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);

      await usdc.mint(await mockLendingPool.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      await aUSDC.mint(await goalz.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      
      await aUSDC.mockBalanceOf(depositAmount); 
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).deposit(0, depositAmount);

      const userBalanceBefore = await usdc.balanceOf(user1.address);
      const goalzBalanceBefore = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

      // Set the mock aToken balance
      const interestAccrued = depositAmount;
      await aUSDC.mockBalanceOf(depositAmount + interestAccrued); 
      await expect(goalz.connect(user1).withdraw(0))
        .to.emit(goalz, "WithdrawMade")
        .withArgs(user1.address, 0, depositAmount + interestAccrued);

      const userBalanceAfter = await usdc.balanceOf(user1.address);
      const goalzBalanceAfter = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
      // const aUSDCBalance = await aUSDC.balanceOf(await goalz.getAddress());

      expect(userBalanceAfter).to.equal(userBalanceBefore + depositAmount + interestAccrued);
      expect(goalzBalanceAfter).to.equal(goalzBalanceBefore);
      expect(goalzUSDBalanceAfter).to.equal(0);
      // expect(aUSDCBalance).to.equal(0);
    });
  });

  describe("Interest Accrual", function () {
    it("should accrue interest over time", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await aUSDC.mockBalanceOf(depositAmount);
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).deposit(0, depositAmount);

      const initialGoalzUSDBalance = await goalzUSD.balanceOf(user1.address);

      // Simulate interest accrual
      const newBalance = depositAmount * BigInt(105) / BigInt(100); // 5% increase
      await aUSDC.mockBalanceOf(newBalance);

      // Fast forward time
      await time.increase(365 * 24 * 60 * 60); // 1 year

      // Trigger an update of the interest index
      await goalz.connect(user1).deposit(0, 1);

      const finalGoalzUSDBalance = await goalzUSD.balanceOf(user1.address);
      expect(finalGoalzUSDBalance).to.be.gt(initialGoalzUSDBalance);

      // Check that the user's balance has increased
      const goal = await goalz.savingsGoals(0);
      expect(goal.currentAmount).to.be.gt(depositAmount);
    });
  });

  describe("Automated Deposits", function () {
    it("should set up an automated deposit", async function () {
      const { goalz } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      
      await expect(goalz.connect(user1).automateDeposit(0, automatedDepositAmount, automatedDepositFrequency))
        .to.emit(goalz, "AutomatedDepositCreated")
        .withArgs(user1.address, 0, automatedDepositAmount, automatedDepositFrequency);

      const autoDeposit = await goalz.automatedDeposits(0);
      expect(autoDeposit.amount).to.equal(automatedDepositAmount);
      expect(autoDeposit.frequency).to.equal(automatedDepositFrequency);
    });

    it("should execute an automated deposit", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).automateDeposit(0, automatedDepositAmount, automatedDepositFrequency);

      // Fast forward time
      await time.increase(automatedDepositFrequency + 1);

      const userBalanceBefore = await usdc.balanceOf(user1.address);
      const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);
      const aUSDCBalanceBefore = await aUSDC.balanceOf(await goalz.getAddress());

      await expect(goalz.connect(automatoor).automatedDeposit(0))
        .to.emit(goalz, "DepositMade")
        .withArgs(user1.address, 0, automatedDepositAmount);

      const userBalanceAfter = await usdc.balanceOf(user1.address);
      const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
      // const aUSDCBalanceAfter = await aUSDC.balanceOf(await goalz.getAddress());

      expect(userBalanceAfter).to.equal(userBalanceBefore - automatedDepositAmount);
      expect(goalzUSDBalanceAfter).to.equal(goalzUSDBalanceBefore + automatedDepositAmount);
      // expect(aUSDCBalanceAfter).to.equal(aUSDCBalanceBefore + automatedDepositAmount);
    });
  });
});