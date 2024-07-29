const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("GoalzToken with Aave Integration", function () {
  let GoalzToken;
  let goalzToken;
  let goalzTokenAddress;
  let MockAaveToken;
  let aaveTokenMock;
  let aaveTokenMockAddress;
  let ERC20Mock;
  let usdc;
  let usdcAddress;
  let deployer;
  let user1;

  // Function that loads the GoalzToken fixture, used in each test
  const loadGoalzTokenFixture = async function () {
    // Deploy mock ERC20 tokens for depositToken and aToken
    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    usdc = await ERC20Mock.deploy("USD Coin", "USDC");
    usdcAddress = await usdc.getAddress();

    const interestRatePerSecond = ethers.parseEther("3805175038").toString(); // Approx 12% APY
    MockAaveToken = await ethers.getContractFactory("MockAaveToken");
    aaveTokenMock = await MockAaveToken.deploy("Aave USD Coin", "aUSDC", interestRatePerSecond);
    aaveTokenMockAddress = await aaveTokenMock.getAddress();
    
    GoalzToken = await ethers.getContractFactory("GoalzToken");
    const _goalzToken = await GoalzToken.deploy("Goalz USD Coin", "glzUSDC", usdcAddress, aaveTokenMockAddress);
    goalzTokenAddress = await _goalzToken.getAddress();

    return [_goalzToken, usdc, aaveTokenMock];
  }

  before(async function () {
    [deployer, user1] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      [goalzToken, usdc, aaveTokenMock] = await loadGoalzTokenFixture();

      expect(await goalzToken.name()).to.equal("Goalz USD Coin");
      expect(await goalzToken.symbol()).to.equal("glzUSDC");
      expect(await goalzToken.owner()).to.equal(deployer.address);
      expect(await goalzToken.depositToken()).to.equal(usdcAddress);
      expect(await goalzToken.aToken()).to.equal(aaveTokenMockAddress);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      [goalzToken, usdc, aaveTokenMock] = await loadGoalzTokenFixture();
    });

    it("should allow the owner to mint tokens", async function () {
      await goalzToken.mint(user1.address, ethers.parseEther("100"));
      expect(await goalzToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("should not allow non-owner to mint tokens", async function () {
      await expect(goalzToken.connect(user1).mint(user1.address, ethers.parseEther("100"))).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      [goalzToken, usdc, aaveTokenMock] = await loadGoalzTokenFixture();
      await goalzToken.mint(user1.address, ethers.parseEther("100"));
    });

    it("should allow the owner to burn tokens", async function () {
      await goalzToken.burn(user1.address, ethers.parseEther("50"));
      expect(await goalzToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("should not allow non-owner to burn tokens", async function () {
      await expect(goalzToken.connect(user1).burn(user1.address, ethers.parseEther("50"))).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Interest Accrual", function () {
    beforeEach(async function () {
      [goalzToken, usdc, aaveTokenMock] = await loadGoalzTokenFixture();
      await aaveTokenMock.mockBalanceOf(ethers.parseEther("100"));
      await goalzToken.mint(user1.address, ethers.parseEther("100"));
    });

    it("should accrue interest over time", async function () {
      // Check the interest index
      const startInterestIndex = await goalzToken.getInterestIndex();

      // Increase the time to simulate interest accrual
      await network.provider.send("evm_increaseTime", [31536000]); // 1 year in seconds
      await network.provider.send("evm_mine");

      // Set mockBalance to simulate interest
      await aaveTokenMock.mockBalanceOf(ethers.parseEther("101"));

      // Update the interest
      await goalzToken.mint(user1.address, 1);

      const endInterestIndex = await goalzToken.getNextInterestIndex();

      expect(endInterestIndex).to.be.gt(startInterestIndex);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      [goalzToken, usdc, aaveTokenMock] = await loadGoalzTokenFixture();
      await goalzToken.mint(user1.address, ethers.parseEther("100"));
    });

    it("should not allow transfers by the owner", async function () {
      await expect(goalzToken.connect(deployer).transfer(user1.address, ethers.parseEther("50"))).to.be.revertedWith("Disabled");
    });

    it("should not allow transfers by non-owners", async function () {
      await expect(goalzToken.connect(user1).transfer(deployer.address, ethers.parseEther("50"))).to.be.revertedWith("Disabled");
    });
  });
});
