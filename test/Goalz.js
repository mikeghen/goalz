const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("SavingsGoal", function () {
  let SavingsGoal;
  let savingsGoal;
  let ERC20Mock;
  let erc20;
  let deployer;
  let user1;
  let user2;

  const targetAmount = ethers.parseEther("10");
  const targetDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
  const depositAmount = ethers.parseEther("5");
  const automatedDepositAmount = ethers.parseEther("2");
  const automatedDepositFrequency = 3600; // 1 hour

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    erc20 = await ERC20Mock.deploy();

    SavingsGoal = await ethers.getContractFactory("Goalz");
    savingsGoal = await SavingsGoal.deploy(erc20.address);
    console.log("SavingsGoal deployed to:", savingsGoal.address);

    await erc20.mint(user1.address, ethers.parseEther("100"));
    await erc20.mint(user2.address, ethers.parseEther("100"));
  });

  it("should create a new savings goal", async function () {
    const tx = await savingsGoal.setGoal("Vacation", "For a dream vacation", targetAmount, targetDate);
    const receipt = await tx.wait();

    expect(receipt.events[0].event).to.equal("GoalCreated");
    expect(receipt.events[0].args.saver).to.equal(user1.address);

    const goalId = receipt.events[0].args.goalId.toNumber();
    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.what).to.equal("Vacation");
    expect(goal.why).to.equal("For a dream vacation");
    expect(goal.targetAmount).to.equal(targetAmount);
    expect(goal.targetDate).to.equal(targetDate);
    expect(goal.currentAmount).to.equal(0);
  });

  it("should deposit funds into a savings goal", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const depositTx = await savingsGoal.connect(user1).deposit(goalId, depositAmount);
    const depositReceipt = await depositTx.wait();

    expect(depositReceipt.events[0].event).to.equal("DepositMade");
    expect(depositReceipt.events[0].args.saver).to.equal(user1.address);
    expect(depositReceipt.events[0].args.goalId).to.equal(goalId);
    expect(depositReceipt.events[0].args.amount).to.equal(depositAmount);

    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.currentAmount).to.equal(depositAmount);
  });

  it("should not deposit funds exceeding the goal target amount", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const depositTx = savingsGoal.connect(user1).deposit(goalId, targetAmount);
    await expect(depositTx).to.be.revertedWith("Deposit exceeds the goal target amount");

    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.currentAmount).to.equal(0);
  });

  it("should withdraw funds from a savings goal", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const depositTx = await savingsGoal.connect(user1).deposit(goalId, depositAmount);
    await depositTx.wait();

    const withdrawTx = await savingsGoal.connect(user1).withdraw(goalId);
    const withdrawReceipt = await withdrawTx.wait();

    expect(withdrawReceipt.events[0].event).to.equal("Transfer");
    expect(withdrawReceipt.events[0].args.from).to.equal(savingsGoal.address);
    expect(withdrawReceipt.events[0].args.to).to.equal(user1.address);
    expect(withdrawReceipt.events[0].args.value).to.equal(depositAmount);

    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.currentAmount).to.equal(0);
  });

  it("should automate deposits to a savings goal", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const approveTx = await erc20.connect(user1).approve(savingsGoal.address, automatedDepositAmount);
    await approveTx.wait();

    const automateTx = await savingsGoal.connect(user1).automateDeposit(goalId, automatedDepositAmount, automatedDepositFrequency);
    const automateReceipt = await automateTx.wait();

    expect(automateReceipt.events[0].event).to.equal("AutomatedDepositCreated");
    expect(automateReceipt.events[0].args.saver).to.equal(user1.address);
    expect(automateReceipt.events[0].args.goalId).to.equal(goalId);
    expect(automateReceipt.events[0].args.amount).to.equal(automatedDepositAmount);
    expect(automateReceipt.events[0].args.frequency).to.equal(automatedDepositFrequency);

    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.currentAmount).to.equal(0);

    const automatedDeposit = await savingsGoal.automatedDeposits(goalId);
    expect(automatedDeposit.amount).to.equal(automatedDepositAmount);
    expect(automatedDeposit.frequency).to.equal(automatedDepositFrequency);
    expect(automatedDeposit.lastDeposit).to.be.within(automateReceipt.blockTimestamp, automateReceipt.blockTimestamp + 10); // Allow some deviation due to mining time
  });

  it("should cancel automated deposits to a savings goal", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const approveTx = await erc20.connect(user1).approve(savingsGoal.address, automatedDepositAmount);
    await approveTx.wait();

    const automateTx = await savingsGoal.connect(user1).automateDeposit(goalId, automatedDepositAmount, automatedDepositFrequency);
    await automateTx.wait();

    const cancelTx = await savingsGoal.connect(user1).cancelAutomateDeposit(goalId);
    const cancelReceipt = await cancelTx.wait();

    expect(cancelReceipt.events[0].event).to.equal("AutomatedDepositCanceled");
    expect(cancelReceipt.events[0].args.saver).to.equal(user1.address);
    expect(cancelReceipt.events[0].args.goalId).to.equal(goalId);

    const automatedDeposit = await savingsGoal.automatedDeposits(goalId);
    expect(automatedDeposit.amount).to.equal(0);
  });

  it("should make automated deposits to a savings goal", async function () {
    const createGoalTx = await savingsGoal.connect(user1).setGoal("Car", "For a new car", targetAmount, targetDate);
    const createGoalReceipt = await createGoalTx.wait();
    const goalId = createGoalReceipt.events[0].args.goalId.toNumber();

    const approveTx = await erc20.connect(user1).approve(savingsGoal.address, automatedDepositAmount);
    await approveTx.wait();

    const automateTx = await savingsGoal.connect(user1).automateDeposit(goalId, automatedDepositAmount, automatedDepositFrequency);
    await automateTx.wait();

    await ethers.provider.send("evm_increaseTime", [automatedDepositFrequency]);
    await ethers.provider.send("evm_mine");

    const automatedDepositTx = await savingsGoal.connect(user1).automatedDeposit(goalId);
    const automatedDepositReceipt = await automatedDepositTx.wait();

    expect(automatedDepositReceipt.events[0].event).to.equal("DepositMade");
    expect(automatedDepositReceipt.events[0].args.saver).to.equal(user1.address);
    expect(automatedDepositReceipt.events[0].args.goalId).to.equal(goalId);
    expect(automatedDepositReceipt.events[0].args.amount).to.equal(automatedDepositAmount);

    const goal = await savingsGoal.savingsGoals(goalId);
    expect(goal.currentAmount).to.equal(automatedDepositAmount);
  });
});
