// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Goalz is ERC721, ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct SavingsGoal {
        string what;
        string why;
        uint targetAmount;
        uint currentAmount;
        uint targetDate;
    }

    struct AutomatedDeposit {
        uint amount;
        uint frequency;
        uint lastDeposit;
    }

    IERC20 public depositToken;
    mapping(uint => SavingsGoal) public savingsGoals;
    mapping(uint => AutomatedDeposit) public automatedDeposits;

    event GoalCreated(address indexed saver, uint indexed goalId, string what, string why, uint targetAmount, uint targetDate);
    event DepositMade(address indexed saver, uint indexed goalId, uint amount);
    event AutomatedDepositCreated(address indexed saver, uint indexed goalId, uint amount, uint frequency);
    event AutomatedDepositCanceled(address indexed saver, uint indexed goalId);

    constructor(address _depositTokenAddress) ERC721("Goalz", "GOALZ") {
        depositToken = IERC20(_depositTokenAddress);
    }

    modifier goalExists(uint goalId) {
        require(goalId < _tokenIdCounter.current(), "Goal does not exist");
        _;
    }

    modifier isGoalOwner(uint goalId) {
        require(msg.sender == ownerOf(goalId), "You are not the owner of this goal");
        _;
    }

    /// @dev Override to activate ERC721Enumerable functionality
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setGoal(string memory what, string memory why, uint targetAmount, uint targetDate) external {
        require(targetAmount > 0, "Target amount should be greater than 0");
        require(targetDate > block.timestamp, "Target date should be in the future");

        uint goalId = _tokenIdCounter.current();
        savingsGoals[goalId] = SavingsGoal(what, why, targetAmount, 0, targetDate);
        _mint(msg.sender, goalId);
        _tokenIdCounter.increment();

        emit GoalCreated(msg.sender, goalId, what, why, targetAmount, targetDate);
    }

    function deposit(uint goalId, uint amount) external goalExists(goalId) {
        require(amount > 0, "Deposit amount should be greater than 0");
        SavingsGoal storage goal = savingsGoals[goalId];
        require(goal.currentAmount + amount <= goal.targetAmount, "Deposit exceeds the goal target amount");

        depositToken.transferFrom(msg.sender, address(this), amount);
        goal.currentAmount += amount;

        emit DepositMade(msg.sender, goalId, amount);
    }

    function withdraw(uint goalId) external goalExists(goalId) isGoalOwner(goalId) {
        SavingsGoal storage goal = savingsGoals[goalId];
        require(goal.currentAmount > 0, "No funds available to withdraw");

        uint amount = goal.currentAmount;
        goal.currentAmount = 0;
        depositToken.transfer(msg.sender, amount);
    }

    function automateDeposit(uint goalId, uint amount, uint frequency) external goalExists(goalId) {
        require(amount > 0, "Automated deposit amount should be greater than 0");
        require(frequency > 0, "Automated deposit frequency should be greater than 0");
        require(automatedDeposits[goalId].amount == 0, "Automated deposit already exists for this goal");
        depositToken.transferFrom(msg.sender, address(this), amount);

        automatedDeposits[goalId] = AutomatedDeposit(amount, frequency, block.timestamp);

        emit AutomatedDepositCreated(msg.sender, goalId, amount, frequency);
    }

    function cancelAutomateDeposit(uint goalId) external goalExists(goalId) isGoalOwner(goalId) {
        delete automatedDeposits[goalId];
        emit AutomatedDepositCanceled(msg.sender, goalId);
    }

    function automatedDeposit(uint goalId) external goalExists(goalId) {
        AutomatedDeposit storage _automatedDeposit = automatedDeposits[goalId];
        require(_automatedDeposit.amount > 0, "No automated deposit for this goal");
        require(block.timestamp >= _automatedDeposit.lastDeposit + _automatedDeposit.frequency, "Deposit frequency not reached yet");

        SavingsGoal storage goal = savingsGoals[goalId];
        uint amount = _automatedDeposit.amount;
        depositToken.transferFrom(msg.sender, address(this), amount);
        goal.currentAmount += amount;
        _automatedDeposit.lastDeposit = block.timestamp;

        emit DepositMade(msg.sender, goalId, amount);
    }

    /// @notice Disable Transfers of tokens
    /// TODO: Should these be transferrable?
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 data) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, data);
    }
}
