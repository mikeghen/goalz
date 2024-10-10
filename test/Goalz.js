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
      // get the before balances, before the deposit
      const userBalanceBefore = await usdc.balanceOf(user1.address);
      const goalzBalanceBefore = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

      await goalz.connect(user1).deposit(0, depositAmount);
            // Set the mock aToken balance
      // 5% increase
      const interestAccrued = depositAmount * BigInt(5) / BigInt(100); // 5% increase
      await aUSDC.mockBalanceOf(depositAmount + interestAccrued + BigInt(1000000000000));
      // time.increase(365 * 24 * 60 * 60); // 1 year
      await time.increase(365 * 24 * 60 * 60); // 1 year
   
      await expect(goalz.connect(user1).withdraw(0))
        .to.emit(goalz, "WithdrawMade");
        // .withArgs(user1.address, 0, depositAmount + interestAccrued);

      const userBalanceAfter = await usdc.balanceOf(user1.address);
      const goalzBalanceAfter = await usdc.balanceOf(await goalz.getAddress());
      const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
      // const aUSDCBalance = await aUSDC.balanceOf(await goalz.getAddress());

      expect(userBalanceAfter).to.be.lt(userBalanceBefore + interestAccrued);
      expect(userBalanceAfter).to.be.gt(userBalanceBefore + interestAccrued - BigInt(10000000000));
      expect(goalzBalanceAfter).to.equal(goalzBalanceBefore);
      expect(goalzUSDBalanceAfter).to.equal(0);
      // expect(aUSDCBalance).to.equal(0);
    });
  });

  describe("Interest Accrual", function () {
    it("should accrue interest over time", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await usdc.mint(await mockLendingPool.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      await aUSDC.mint(await goalz.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      
      await aUSDC.mockBalanceOf(depositAmount);
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).deposit(0, depositAmount);

      const initialUser1Balance = await usdc.balanceOf(user1.address);
      
      const initialGoalzUSDBalance = await goalzUSD.balanceOf(user1.address);

      // Simulate interest accrual
      let newBalance = depositAmount * BigInt(105) / BigInt(100); // 5% increase
      
      await aUSDC.mockBalanceOf(newBalance);

      // Fast forward time
      await time.increase(365 * 24 * 60 * 60); // 1 year

      // Trigger an update of the interest index
      await goalz.connect(user1).deposit(0, depositAmount);

      
      newBalance = newBalance + depositAmount + BigInt(1000000000000);
      newBalance = newBalance * BigInt(105) / BigInt(100);
      await aUSDC.mockBalanceOf(newBalance);
      // Fast forward time
      await time.increase(365 * 24 * 60 * 60); // 1 year

      // Trigger an update of the interest index
      const currentUser1Balance = await usdc.balanceOf(user1.address);
      await goalz.connect(user1).withdraw(0);

      const finalUser1Balance = await usdc.balanceOf(user1.address);
      expect(finalUser1Balance).to.be.lt(initialUser1Balance + newBalance);
      expect(finalUser1Balance-currentUser1Balance).to.be.gt(newBalance - BigInt(1000000000000000));

    });
    it("accrue interest two goals", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await usdc.mint(await mockLendingPool.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      await aUSDC.mint(await goalz.getAddress(), depositAmount * 2n); // Give it enough tokens for this test.
      
      await aUSDC.mockBalanceOf(depositAmount);
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).deposit(0, depositAmount);

      await goalz.connect(user2).setGoal("Lambo", "For a fun driving experience", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user2).deposit(1, depositAmount);

      const initialUser1Balance = await usdc.balanceOf(user1.address);
      const initialUser2Balance = await usdc.balanceOf(user2.address);

      const initialUser1GoalzUSDBalance = await goalzUSD.balanceOf(user1.address);
      const initialUser2GoalzUSDBalance = await goalzUSD.balanceOf(user2.address);

      // Simulate interest accrual
      let newBalance = depositAmount * BigInt(105) / BigInt(100); // 5% increase
      newBalance = newBalance * BigInt(2);
      
      await aUSDC.mockBalanceOf(newBalance);

      // Fast forward time
      await time.increase(365 * 24 * 60 * 60); // 1 year

      // Trigger an update of the interest index
      await goalz.connect(user1).deposit(0, depositAmount);
      await goalz.connect(user2).deposit(1, depositAmount);
      
      newBalance = newBalance + (BigInt(2) * (depositAmount + BigInt(1000000000000)));
      newBalance = newBalance * BigInt(105) / BigInt(100);
      await aUSDC.mockBalanceOf(newBalance);
      // Fast forward time
      await time.increase(365 * 24 * 60 * 60); // 1 year

      // Trigger an update of the interest index
      const currentUser1Balance = await usdc.balanceOf(user1.address);
      const currentUser2Balance = await usdc.balanceOf(user2.address);
      await goalz.connect(user1).withdraw(0);
      await goalz.connect(user2).withdraw(1);

      const finalUser1Balance = await usdc.balanceOf(user1.address);
      const finalUser2Balance = await usdc.balanceOf(user2.address);
      const dividedBalance = newBalance / BigInt(2);
      expect(finalUser1Balance).to.be.lt(initialUser1Balance + dividedBalance);
      expect(finalUser1Balance-currentUser1Balance).to.be.gt(dividedBalance - BigInt(1000000000000000));
      expect(finalUser2Balance).to.be.lt(initialUser2Balance + dividedBalance);
      expect(finalUser2Balance-currentUser2Balance).to.be.gt(dividedBalance - BigInt(1000000000000000));
    });

    it("accrue interest two goals, different deposit amounts and times", async function () {
      const { goalz, usdc, goalzUSD, aUSDC } = await loadFixture(deployGoalzFixture);
      
      await usdc.mint(await mockLendingPool.getAddress(), depositAmount * 4n); // Give it enough tokens for this test.
      await aUSDC.mint(await goalz.getAddress(), depositAmount * 4n); // Give it enough tokens for this test.
      const otherDepositAmount = depositAmount / 2n;
      
      await goalz.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user1).deposit(0, otherDepositAmount);
      
      await goalz.connect(user2).setGoal("Lambo", "For a fun driving experience", targetAmount, targetDate, usdcAddress);
      await goalz.connect(user2).deposit(1, depositAmount);
      let balance1 = otherDepositAmount;
      let balance2 = depositAmount;
      let newBalance = balance1 + balance2;
      await aUSDC.mockBalanceOf(newBalance);

      const initialUser1Balance = await usdc.balanceOf(user1.address);
      const initialUser2Balance = await usdc.balanceOf(user2.address);

      const initialUser1GoalzUSDBalance = await goalzUSD.balanceOf(user1.address);
      const initialUser2GoalzUSDBalance = await goalzUSD.balanceOf(user2.address);

      // Simulate interest accrual one goal, normalized to .5 years;
      let interest = (otherDepositAmount * BigInt(105)) / BigInt(200); // 5% increase, normalized to .5 years;
      newBalance += interest; 
      await aUSDC.mockBalanceOf(newBalance);

      // Fast forward time
      await time.increase(183* 24 * 60 * 60); // 0.5 year

      // Trigger an update of the interest index
      await goalz.connect(user1).deposit(0, otherDepositAmount);
      // do not deposit into the second goal      
      newBalance = newBalance + otherDepositAmount;
      newBalance += interest; // 5% increase, normalized to .5 years;

      await aUSDC.mockBalanceOf(newBalance);

      
      // fast forward to 1.0 year
      await time.increase(182 * 24 * 60 * 60); // 0.5 year added to the previous 1.0 year
      // yearly deposit, both goals
      await goalz.connect(user1).deposit(0, depositAmount);
      await goalz.connect(user2).deposit(1, depositAmount);
      await time.increase(365 * 24 * 60 * 60); // 1 year

      newBalance = newBalance + (depositAmount * BigInt(2));
      newBalance += (newBalance * BigInt(105) / BigInt(100)); // 5% increase, normalized for 1 years;
      await aUSDC.mockBalanceOf(newBalance);

      const currentUser1Balance = await usdc.balanceOf(user1.address);
      const currentUser2Balance = await usdc.balanceOf(user2.address);
      await goalz.connect(user1).withdraw(0);
      await goalz.connect(user2).withdraw(1);

      const finalUser1Balance = await usdc.balanceOf(user1.address);
      const finalUser2Balance = await usdc.balanceOf(user2.address);
      const user1balance = finalUser1Balance - currentUser1Balance;
      const user2balance = finalUser2Balance - currentUser2Balance;
      const dividedBalance = newBalance / BigInt(2);
      expect(user1balance).to.be.lt(user2balance);
      let totalDeposit = depositAmount * BigInt(2);
      const maxInterest = totalDeposit * BigInt(112) / BigInt(100);
      expect(user1balance).to.be.gt(totalDeposit);
      expect(user2balance).to.be.gt(totalDeposit);
      expect(user1balance).to.be.lt(totalDeposit + maxInterest);
      expect(user2balance).to.be.lt(totalDeposit + maxInterest);
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