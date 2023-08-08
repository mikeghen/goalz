const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

// Integration testing for the base blockchain
// Hardhat must be configured to work with a fork of the Base mainnet

const USDC_ADDRESS = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";
// As of block 2332266
const USDC_WHALE_ADDRESS = "0xb38A90f14b24ae81Ec0B8f1373694f5B59811D8A";
const ETH_WHALE_ADDRESS = "0x5455a28f1d5116610c3627fcb672d165d553d018";
// Some address to impersonate for user1, user2, and automatoor (random)
const USER1_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const AUTOMATOOR_ADDRESS = "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db";

describe("SavingsGoal", function () {
  let SavingsGoal;
  let savingsGoal;
  let usdc;
  let goalzToken;
  let deployer;
  let user1;
  let automatoor;

  const targetAmount = ethers.parseEther("10");
  const targetDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
  const depositAmount = ethers.parseEther("5");
  const automatedDepositAmount = ethers.parseEther("5");
  const automatedDepositFrequency = 3600; // 1 hour

  // Function that loads the savingsGoal fixture, used in each test
  const loadSavingsGoalFixture = async function () {
    SavingsGoal = await ethers.getContractFactory("Goalz");
    const _savingsGoal = await SavingsGoal.deploy(await usdc.getAddress());
    return _savingsGoal;
  }

  before(async function () {
    [deployer] = await ethers.getSigners();

    // Get USDC contract at
    usdc = await ethers.getContractAt("ERC20Mock", USDC_ADDRESS);

    // Impersonate the USDC whale
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE_ADDRESS],
    });
    const usdcWhale = await ethers.provider.getSigner(USDC_WHALE_ADDRESS);

    // Impersonate the ETH whale
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ETH_WHALE_ADDRESS],
    });
    const ethWhale = await ethers.provider.getSigner(ETH_WHALE_ADDRESS);

    // Impersonate user1
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USER1_ADDRESS],
    });
    user1 = await ethers.provider.getSigner(USER1_ADDRESS);

    // Impersonate automatoor
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [AUTOMATOOR_ADDRESS],
    });
    automatoor = await ethers.provider.getSigner(AUTOMATOOR_ADDRESS);

    // Transfer user1 some USDC
    await usdc.connect(usdcWhale).transfer(user1.address, ethers.parseEther("1000"));

    // Send deployer, user1, automator some ETH from the ETH whale
    await ethWhale.sendTransaction({
      to: deployer.address,
      value: ethers.utils.parseEther("1"),
    });
    await ethWhale.sendTransaction({
      to: user1.address,
      value: ethers.utils.parseEther("1"),
    });
    await ethWhale.sendTransaction({
      to: automatoor.address,
      value: ethers.utils.parseEther("1"),
    });
  });

  describe("set a goal and make a deposit until the goal is complete, then withdraw", function () {
    it("should work", async function () {
      savingsGoal = await loadSavingsGoalFixture();
      
      // Create a savings goal for user1
      await savingsGoal.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate);
      // Approve the savings goal contract to spend user1's tokens
      const savingsGoalAddress = await savingsGoal.getAddress();
      await usdc.connect(user1).approve(savingsGoalAddress, ethers.MaxUint256);
      // Make a deposit to user1's savings goal
      await savingsGoal.connect(user1).deposit(0, depositAmount);
      // Expect the currentAmount is equal to the depositAmount
      const goal = await savingsGoal.savingsGoals(0);
      expect(goal.currentAmount).to.equal(depositAmount);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter = await usdc.balanceOf(await savingsGoal.getAddress());
      const goalzTokenBalanceAfter = await goalzToken.balanceOf(user1.address);
      expect(user1BalanceAfter).to.equal(ethers.parseEther("995"));
      expect(savingsGoalBalanceAfter).to.equal(ethers.parseEther("5"));
      expect(goalzTokenBalanceAfter).to.equal(ethers.parseEther("5"));
      // Make another deposit to complete the goal
      await savingsGoal.connect(user1).deposit(0, depositAmount); 
      // Expect the currentAmount is equal to the targetAmount
      const goal2 = await savingsGoal.savingsGoals(0);
      expect(goal2.currentAmount).to.equal(targetAmount);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter2 = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter2 = await usdc.balanceOf(await savingsGoal.getAddress());
      const goalzTokenBalanceAfter2 = await goalzToken.balanceOf(user1.address);
      expect(user1BalanceAfter2).to.equal(ethers.parseEther("990"));
      expect(savingsGoalBalanceAfter2).to.equal(ethers.parseEther("10"));
      expect(goalzTokenBalanceAfter2).to.equal(ethers.parseEther("10"));
      // Withdraw the funds from the savings goal
      await savingsGoal.connect(user1).withdraw(0);
      // Expect the currentAmount is equal to 0
      const goal3 = await savingsGoal.savingsGoals(0);
      expect(goal3.currentAmount).to.equal(0);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter3 = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter3 = await usdc.balanceOf(await savingsGoal.getAddress());
      const goalzTokenBalanceAfter3 = await goalzToken.balanceOf(user1.address);
      expect(user1BalanceAfter3).to.equal(ethers.parseEther("1000"));
      expect(savingsGoalBalanceAfter3).to.equal(ethers.parseEther("0"));
      expect(goalzTokenBalanceAfter3).to.equal(ethers.parseEther("0"));
    });
  });

  describe("set a goal and automate the deposits until the goal is complete, then withdraw", function () {
    it("should work", async function () {
      savingsGoal = await loadSavingsGoalFixture();
      
      // Create a savings goal for user1
      await savingsGoal.connect(user1).setGoal("Vacation", "For a dream vacation", targetAmount, targetDate);
      // Approve the savings goal contract to spend user1's tokens
      const savingsGoalAddress = await savingsGoal.getAddress();
      await usdc.connect(user1).approve(savingsGoalAddress, ethers.MaxUint256);
      // Create an automated deposit for user1
      await savingsGoal.connect(user1).automateDeposit(0, automatedDepositAmount, automatedDepositFrequency);
      // Expect the automated deposit to have been created
      const automatedDeposit = await savingsGoal.automatedDeposits(0);
      expect(automatedDeposit.amount).to.equal(automatedDepositAmount);
      expect(automatedDeposit.frequency).to.equal(automatedDepositFrequency);
      // Increase the time by 1 day
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");
      // Trigger the automated deposit to make a deposit
      await savingsGoal.connect(automatoor).automatedDeposit(0);
      // Expect the currentAmount is equal to the automatedDepositAmount
      const goal = await savingsGoal.savingsGoals(0);
      expect(goal.currentAmount).to.equal(automatedDepositAmount);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter = await usdc.balanceOf(await savingsGoal.getAddress());
      expect(user1BalanceAfter).to.equal(ethers.parseEther("995"));
      expect(savingsGoalBalanceAfter).to.equal(ethers.parseEther("5"));
      // Increase the time by 1 day
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");
      // Trigger the automated deposit to make a deposit
      await savingsGoal.connect(automatoor).automatedDeposit(0);
      // Expect the currentAmount is equal to the targetAmount
      const goal2 = await savingsGoal.savingsGoals(0);
      expect(goal2.currentAmount).to.equal(targetAmount);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter2 = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter2 = await usdc.balanceOf(await savingsGoal.getAddress());
      expect(user1BalanceAfter2).to.equal(ethers.parseEther("990"));
      expect(savingsGoalBalanceAfter2).to.equal(ethers.parseEther("10"));
      // Withdraw the funds from the savings goal
      await savingsGoal.connect(user1).withdraw(0);
      // Expect the currentAmount is equal to 0
      const goal3 = await savingsGoal.savingsGoals(0);
      expect(goal3.currentAmount).to.equal(0);
      // Expect the balances for the savings goal contract and user1 to have changed
      const user1BalanceAfter3 = await usdc.balanceOf(user1.address);
      const savingsGoalBalanceAfter3 = await usdc.balanceOf(await savingsGoal.getAddress());
      expect(user1BalanceAfter3).to.equal(ethers.parseEther("1000"));
      expect(savingsGoalBalanceAfter3).to.equal(ethers.parseEther("0"));
    });
  });
});
