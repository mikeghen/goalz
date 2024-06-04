const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("GoalzToken", function () {
  let GoalzToken;
  let goalzToken;
  let deployer;
  let user1;

  // Function that loads the GoalzToken fixture, used in each test
  const loadGoalzTokenFixture = async function () {
    GoalzToken = await ethers.getContractFactory("GoalzToken");
    const _goalzToken = await GoalzToken.deploy("Goalz Token", "GLZ");
    return _goalzToken;
  }

  before(async function () {
    [deployer, user1] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("should deploy the contract", async function () {
      goalzToken = await loadGoalzTokenFixture();

      expect(await goalzToken.name()).to.equal("Goalz Token");
      expect(await goalzToken.symbol()).to.equal("GLZ");
      expect(await goalzToken.owner()).to.equal(deployer.address);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      goalzToken = await loadGoalzTokenFixture();
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
      goalzToken = await loadGoalzTokenFixture();
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

  describe("Transfers", function () {
    beforeEach(async function () {
      goalzToken = await loadGoalzTokenFixture();
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
