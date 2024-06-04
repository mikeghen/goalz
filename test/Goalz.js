const { time, loadFixture, AbiCoder } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("SavingsGoal", function () {
  let SavingsGoal;
  let savingsGoal;
  let ERC20Mock;
  let usdc;
  let weth;
  let usdcAddress;
  let wethAddress;
  let goalzUSD;
  let goalzETH;
  let deployer;
  let user1;
  let user2;
  let automatoor;
  let mockGelato;

  const targetAmount = ethers.parseEther("10");
  const targetDate = Math.floor(Date.now() / 1000) + 86400 * 100; // 1 day from now
  const depositAmount = ethers.parseEther("5");
  const automatedDepositAmount = ethers.parseEther("2");
  const automatedDepositFrequency = 3600; // 1 hour

  // Function that loads the savingsGoal fixture, used in each test
  const loadSavingsGoalFixture = async function () {
    SavingsGoal = await ethers.getContractFactory("Goalz");
    usdcAddress = await usdc.getAddress();
    wethAddress = await weth.getAddress();
    const _savingsGoal = await SavingsGoal.deploy([usdcAddress, wethAddress], await mockGelato.getAddress());
    const _goalzUSD = await ethers.getContractAt("GoalzToken", await _savingsGoal.goalzTokens(usdcAddress));
    const _goalzETH = await ethers.getContractAt("GoalzToken", await _savingsGoal.goalzTokens(wethAddress));

    return [_savingsGoal, _goalzETH, _goalzUSD];
  }

  before(async function () {
    // Deploy MockGelato contract
    const MockGelato = await ethers.getContractFactory("MockGelato");
    mockGelato = await MockGelato.deploy();

    // Set addresses for deployer, user1, and user2
    [deployer, user1, user2, automatoor] = await ethers.getSigners();

    // Make a mock usdc token
    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    usdc = await ERC20Mock.deploy("USD Coin", "USDC");
    weth = await ERC20Mock.deploy("Wrapped Ether", "WETH");

    // Give user1 and user2 some tokens
    await usdc.mint(user1.address, ethers.parseEther("1000"));
    await usdc.mint(user2.address, ethers.parseEther("1000"));
    await weth.mint(user1.address, ethers.parseEther("1000"));
    await weth.mint(user2.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      [savingsGoal, goalzETH, goalzUSD] = await loadSavingsGoalFixture();
      expect(await savingsGoal.name()).to.equal("Goalz");
      expect(await savingsGoal.symbol()).to.equal("GOALZ");

      // Check the goalzUSD token name and symbol 
      expect(await goalzUSD.name()).to.equal("Goalz USD Coin");
      expect(await goalzUSD.symbol()).to.equal("glzUSDC");

      // Check the goalzETH token name and symbol
      expect(await goalzETH.name()).to.equal("Goalz Wrapped Ether");
      expect(await goalzETH.symbol()).to.equal("glzWETH");
    });
  });

  describe("setGoal", function () {
    before(async function () {
      [savingsGoal, goalzETH, goalzUSD] = await loadSavingsGoalFixture();
    });

    it("should not create a new savings goal if the target amount is 0", async function () {
      await expect(savingsGoal.setGoal("Vacation", "For a dream vacation", 0, targetDate, usdcAddress)).to.be.revertedWith("Target amount should be greater than 0");
    });

    it("should not create a new savings goal if the target date is in the past", async function () {
      await expect(savingsGoal.setGoal("Vacation", "For a dream vacation", targetAmount, Math.floor(Date.now() / 1000) - 1, usdcAddress)).to.be.revertedWith("Target date should be in the future");
    });

    it("should create a new savings goals", async function () {
      expect(
        await savingsGoal.setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress)
      ).to.emit(savingsGoal, "GoalCreated")
        .withArgs(user1.address, 0, "Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);

      const goal = await savingsGoal.savingsGoals(0);
      expect(goal.what).to.equal("Vacation");
      expect(goal.why).to.equal("For a dream vacation");
      expect(goal.targetAmount).to.equal(targetAmount);
      expect(goal.targetDate).to.equal(targetDate);
      expect(goal.currentAmount).to.equal(0);
      expect(goal.depositToken).to.equal(usdcAddress)

      // Create a second goal with weth
      await savingsGoal.setGoal("Car", "For a new car", targetAmount, targetDate, wethAddress);
      const goal2 = await savingsGoal.savingsGoals(1);
      expect(goal2.what).to.equal("Car");
      expect(goal2.why).to.equal("For a new car");
      expect(goal2.targetAmount).to.equal(targetAmount);
      expect(goal2.targetDate).to.equal(targetDate);
      expect(goal2.currentAmount).to.equal(0);
      expect(goal2.depositToken).to.equal(wethAddress)
    });
  });

  context("with savings goals", function () {
    beforeEach(async function () {
      [savingsGoal, goalzETH, goalzUSD] = await loadSavingsGoalFixture();
      // Create a savings goal for user1 and user2
      await savingsGoal.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate, usdcAddress);
      await savingsGoal.connect(user2).setGoal("Car", "For a new car", targetAmount, targetDate, usdcAddress);
      // Approve the savings goal contract to spend user1's and user2's tokens
      const savingsGoalAddress = await savingsGoal.getAddress();
      await usdc.connect(user1).approve(savingsGoalAddress, ethers.MaxUint256);
      await usdc.connect(user2).approve(savingsGoalAddress, ethers.MaxUint256);
    });

    describe("deposit", function () {
      it("should not deposit if the goal does not exist", async function () {
        expect(
          savingsGoal.connect(user1).deposit(2, depositAmount)
        ).to.be.revertedWith("Goal does not exist");
      });

      it("should not deposit if the amount is 0", async function () {
        expect(
          savingsGoal.connect(user2).deposit(1, 0)
        ).to.be.revertedWith("Deposit amount should be greater than 0");
      });

      it("should not deposit if the goal is already completed/deposit exceeds target", async function () {
        await savingsGoal.connect(user1).deposit(0, targetAmount);
        await expect(
          savingsGoal.connect(user1).deposit(0, 1)
        ).to.be.revertedWith("Deposit exceeds the goal target amount");
      });

      it("should deposit funds into a savings goal usdc token", async function () {

        // Get the goalzUSD
        goalzUSD = await ethers.getContractAt("GoalzToken", await savingsGoal.goalzTokens(usdcAddress));

        // Check the user and the savings goal contract's token balances before and after the deposit
        const user2BalanceBefore = await usdc.balanceOf(user2.address);
        const savingsGoalBalanceBefore = await usdc.balanceOf(await savingsGoal.getAddress());
        const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user2.address);

        expect(
          await savingsGoal.connect(user2).deposit(1, depositAmount)
        ).to.emit(savingsGoal, "DepositMade")
          .withArgs(user2.address, 1, depositAmount);

        const goal = await savingsGoal.savingsGoals(1);
        expect(goal.currentAmount).to.equal(depositAmount);

        // Check and verify the balances afterwards
        const user2BalanceAfter = await usdc.balanceOf(user2.address);
        const savingsGoalBalanceAfter = await usdc.balanceOf(await savingsGoal.getAddress());
        const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user2.address);
        expect(user2BalanceAfter).to.equal(user2BalanceBefore - depositAmount);
        expect(savingsGoalBalanceAfter).to.equal(savingsGoalBalanceBefore + depositAmount);
        expect(goalzUSDBalanceAfter).to.equal(goalzUSDBalanceBefore + depositAmount);

      });
    });

    describe("withdraw", function () {
      beforeEach(async function () {
        // Make a deposit to user1's savings goal
        await savingsGoal.connect(user1).deposit(0, depositAmount);
        // Expect the currentAmount is equal to the depositAmount
        const goal = await savingsGoal.savingsGoals(0);
        expect(goal.currentAmount).to.equal(depositAmount);
      });

      it("should not withdraw if the goal does not exist", async function () {
        expect(
          savingsGoal.connect(user1).withdraw(2)
        ).to.be.revertedWith("Goal does not exist");
      });

      it("should not withdraw if the currentAmount is 0", async function () {
        expect(
          savingsGoal.connect(user2).withdraw(1)
        ).to.be.revertedWith("No funds to withdraw");
      });

    //   it("should withdraw funds from a savings goal", async function () {

    //     // Get the goalzUSD
    //     goalzUSD = await ethers.getContractAt("GoalzToken", await savingsGoal.goalzTokens(usdcAddress));

    //     // Check user1's balance before and after the withdrawal
    //     const user1BalanceBefore = await usdc.balanceOf(user1.address);
    //     const user1goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

    //     expect(
    //       await savingsGoal.connect(user1).withdraw(0)
    //     ).to.emit(savingsGoal, "WithdrawMade")
    //       .withArgs(user1.address, 0, depositAmount);

    //     const goal = await savingsGoal.savingsGoals(0);
    //     expect(goal.currentAmount).to.equal(0);

    //     // Check user1's balance after the withdrawal
    //     const user1BalanceAfter = await usdc.balanceOf(user1.address);
    //     const user1goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);
    //     expect(user1BalanceAfter).to.equal(user1BalanceBefore + depositAmount);
    //     expect(user1goalzUSDBalanceAfter).to.equal(user1goalzUSDBalanceBefore - depositAmount);
    //   });
    });

    describe("deleteGoal", function () {
      it("should not delete the goal if the goal does not exist", async function () {
        await expect(
          savingsGoal.connect(user1).deleteGoal(2)
        ).to.be.revertedWith("Goal does not exist");
      });

      it("should not delete the goal if the currentAmount is not 0", async function () {
        await savingsGoal.connect(user1).deposit(0, depositAmount);
        await expect(
          savingsGoal.connect(user1).deleteGoal(0)
        ).to.be.revertedWith("Goal has funds, withdraw them first");
      });

      it("should delete the goal and withdraw", async function () {

        expect(
          await savingsGoal.connect(user1).deleteGoal(0)
        ).to.emit(savingsGoal, "GoalDeleted")
          .withArgs(user1.address, 0);

        const goal = await savingsGoal.savingsGoals(0);
        expect(goal.what).to.equal("");
        expect(goal.why).to.equal("");
        expect(goal.targetAmount).to.equal(0);
        expect(goal.targetDate).to.equal(0);
        expect(goal.currentAmount).to.equal(0);
      });
    });

    describe("automateDeposit", function () {
      it("should not automate deposit if the goal does not exist", async function () {
        expect(
          savingsGoal.connect(user1).automateDeposit(2, depositAmount, automatedDepositFrequency)
        ).to.be.revertedWith("Goal does not exist");
      });

      it("should not automate deposit if the amount is 0", async function () {
        expect(
          savingsGoal.connect(user2).automateDeposit(1, 0, automatedDepositFrequency)
        ).to.be.revertedWith("Automated deposit amount should be greater than 0");
      });

      it("should not automate deposit if the frequency is 0", async function () {
        expect(
          savingsGoal.connect(user2).automateDeposit(1, depositAmount, 0)
        ).to.be.revertedWith("Automated deposit frequency should be greater than 0");
      });

      it("should not create multiple automated deposits", async function () {
        await savingsGoal.connect(user1).automateDeposit(0, depositAmount, automatedDepositFrequency);
        await expect(
          savingsGoal.connect(user1).automateDeposit(0, 1, automatedDepositFrequency)
        ).to.be.revertedWith("Automated deposit already exists for this goal");
      });

      it("should register an automate deposit", async function () {
        expect(
          await savingsGoal.connect(user2).automateDeposit(1, depositAmount, automatedDepositFrequency)
        ).to.emit(savingsGoal, "AutomatedDepositCreated")
          .withArgs(user2.address, 1, depositAmount, automatedDepositFrequency);

        const automatedDeposit = await savingsGoal.automatedDeposits(1);
        expect(automatedDeposit.amount).to.equal(depositAmount);
        expect(automatedDeposit.frequency).to.equal(automatedDepositFrequency);
      });
    });

    context("with an automated deposit", function () {
      beforeEach("create an automated deposit for user1", async function () {
        await savingsGoal.connect(user1).automateDeposit(0, depositAmount, automatedDepositFrequency);
      });

      it("should not deposit if the automated deposit exceeds the goal target amount", async function () {
        // Set up a goal with a small remaining amount
        await savingsGoal.connect(user1).setGoal("Small Goal", "To test the limit", ethers.parseEther("1"), targetDate, usdcAddress);

        // Create an automated deposit with a larger amount than the remaining target
        await savingsGoal.connect(user1).automateDeposit(2, ethers.parseEther("11"), automatedDepositFrequency);

        // Increase the time by 1 day
        await network.provider.send("evm_increaseTime", [86400]);
        await network.provider.send("evm_mine");

        await expect(
          savingsGoal.connect(automatoor).automatedDeposit(2)
        ).to.be.revertedWith("Automated deposit exceeds the goal target amount");
      });

      describe("cancelAutomatedDeposit", function () {
        it("should not cancel automated deposit if the goal does not exist", async function () {
          expect(
            savingsGoal.connect(user1).cancelAutomatedDeposit(2)
          ).to.be.revertedWith("Goal does not exist");
        });

        it("should cancel an automated deposit", async function () {
          expect(
            await savingsGoal.connect(user1).cancelAutomatedDeposit(0)
          ).to.emit(savingsGoal, "AutomatedDepositCanceled")
            .withArgs(user1.address, 0);

          const automatedDeposit = await savingsGoal.automatedDeposits(0);
          expect(automatedDeposit.amount).to.equal(0);
          expect(automatedDeposit.frequency).to.equal(0);
        });
      });

      describe("automatedDeposit", function () {
        it("should not deposit if the goal does not exist", async function () {
          expect(
            savingsGoal.connect(user1).automatedDeposit(2)
          ).to.be.revertedWith("Goal does not exist");
        });

        it("should not deposit if the automated deposit frequency has not been reached", async function () {
          expect(
            savingsGoal.connect(user1).automatedDeposit(0)
          ).to.be.revertedWith("Deposit frequency not reached yet");
        });

        it("should deposit if the automated deposit frequency has been reached", async function () {
          // Get the goalzUSD
          goalzUSD = await ethers.getContractAt("GoalzToken", await savingsGoal.goalzTokens(usdcAddress));

          // Increase the time by 1 day
          await network.provider.send("evm_increaseTime", [86400]);
          await network.provider.send("evm_mine");

          // Check balances of the user1 and the savings goal contract
          const user1BalanceBefore = await usdc.balanceOf(user1.address);
          const savingsGoalBalanceBefore = await usdc.balanceOf(await savingsGoal.getAddress());
          const goalzUSDBalanceBefore = await goalzUSD.balanceOf(user1.address);

          expect(
            await savingsGoal.connect(automatoor).automatedDeposit(0)
          ).to.emit(savingsGoal, "DepositMade")
            .withArgs(user1.address, 0, depositAmount);

          const goal = await savingsGoal.savingsGoals(0);
          expect(goal.currentAmount).to.equal(depositAmount);

          // Check balances of the user1 and the savings goal contract
          const user1BalanceAfter = await usdc.balanceOf(user1.address);
          const savingsGoalBalanceAfter = await usdc.balanceOf(await savingsGoal.getAddress());
          const goalzUSDBalanceAfter = await goalzUSD.balanceOf(user1.address);

          // Check that the user1's and savings goal contract's balances have changed
          expect(user1BalanceAfter).to.equal(user1BalanceBefore - depositAmount);
          expect(savingsGoalBalanceAfter).to.equal(savingsGoalBalanceBefore + depositAmount);
          expect(goalzUSDBalanceAfter).to.equal(goalzUSDBalanceBefore + depositAmount);
        });
      });
    });

    describe("depositFundsTo1Balance", function () {
      xit("should deposit funds to 1Balance", async function () {
        await savingsGoal.connect(user1).depositFundsTo1Balance(depositAmount, usdcAddress);
        // Check the 1Balance contract to verify the deposit, if there is a way to do so in the test environment.
      });
    });
  });
});
