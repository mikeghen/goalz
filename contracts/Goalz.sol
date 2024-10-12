// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "./interfaces/IQuoter.sol";
import "./interfaces/ISwapRouter.sol";
import "./GoalzToken.sol";
//import "./IGoalzToken.sol";
import "./gelato/AutomateTaskCreator.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Goalz is ERC721, ERC721Enumerable, AutomateTaskCreator, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    Counters.Counter private _tokenIdCounter;

    struct SavingsGoal {
        string what;
        string why;
        uint targetAmount;
        uint currentAmount;
        uint targetDate;
        address depositToken;
        bool complete;
        uint256 startInterestIndex;
        address savingToken;
    }

    struct AutomatedDeposit {
        uint amount;
        uint frequency;
        uint lastDeposit;
        bytes32 gelatoTaskId;
    }

    uint256 constant CHECK_DURATION = 10 minutes * 1000; // 10 min as milliseconds
    IPool public lendingPool;
    mapping(address => GoalzToken) public goalzTokens;
    mapping(uint => SavingsGoal) public savingsGoals;
    mapping(uint => AutomatedDeposit) public automatedDeposits;

    ISwapRouter public immutable swapRouter;
    IQuoter public immutable quoter;
    uint24 public constant poolFee = 3000;
    uint256 public constant SLIPPAGE_TOLERANCE = 50; // 0.5%

    event GoalCreated(address indexed saver, uint indexed goalId, string what, string why, uint targetAmount, uint targetDate, address depositToken, address savingToken, uint256 interestIndex);
    event GoalDeleted(address indexed saver, uint indexed goalId);
    event GoalzTokenCreated(address indexed depositToken, address indexed goalzToken);
    event DepositMade(address indexed saver, uint indexed goalId, uint amount);
    event WithdrawMade(address indexed saver, uint indexed goalId, uint amount);
    event AutomatedDepositCreated(address indexed saver, uint indexed goalId, uint amount, uint frequency);
    event AutomatedDepositCanceled(address indexed saver, uint indexed goalId);
    event GoalCompleted(address indexed saver, uint indexed goalId, uint targetAmount);

    constructor(address[] memory _initialDepositTokens, address[] memory _initialATokens, address _automate, address _lendingPool, address _swapRouter, address _quoter) 
        ERC721("Goalz", "GOALZ") 
        AutomateTaskCreator(_automate) 
    {
        require(_initialDepositTokens.length == _initialATokens.length, "Deposit tokens and aTokens should be the same length");
        for (uint i = 0; i < _initialDepositTokens.length; i++) {
            _addDepositToken(_initialDepositTokens[i], _initialATokens[i]);
        }
        lendingPool = IPool(_lendingPool);
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
    }

    function _addDepositToken(address _depositToken, address _aToken) internal {
        ERC20 _token = ERC20(_depositToken);
        GoalzToken _goalzToken = new GoalzToken(
            string.concat("Goalz ", _token.name()), 
            string.concat("glz", _token.symbol()),
            _depositToken,
            _aToken
        );
        goalzTokens[_depositToken] = _goalzToken;
        emit GoalzTokenCreated(_depositToken, address(_goalzToken));
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

    function setGoal(
        string memory what, 
        string memory why, 
        uint targetAmount, 
        uint targetDate,
        address depositToken,
        address savingToken
    ) external {
        require(targetAmount > 0, "Target amount should be greater than 0");
        require(targetDate > block.timestamp, "Target date should be in the future");
        require(address(goalzTokens[depositToken]) != address(0), "Deposit token should be USDC or WETH");
        require(address(goalzTokens[savingToken]) != address(0), "Invalid saving token");

        uint goalId = _tokenIdCounter.current();
        uint256 startInterestIndex = goalzTokens[savingToken].getInterestIndex();
        savingsGoals[goalId] = SavingsGoal(what, why, targetAmount, 0, targetDate, depositToken, false, startInterestIndex, savingToken);
        _mint(msg.sender, goalId);
        _tokenIdCounter.increment();

        emit GoalCreated(msg.sender, goalId, what, why, targetAmount, targetDate, depositToken, savingToken, startInterestIndex);
    }

    function deleteGoal(uint goalId) external goalExists(goalId) isGoalOwner(goalId) {
        require(savingsGoals[goalId].currentAmount == 0, "Goal has funds, withdraw them first");
        delete savingsGoals[goalId];
        _cancelAutomatedDeposit(goalId);
        _burn(goalId);
        
        emit GoalDeleted(msg.sender, goalId);
    }

    function deposit(uint goalId, uint amount) external goalExists(goalId) {
        require(amount > 0, "Deposit amount should be greater than 0");
        require(msg.sender != address(0), "Invalid sender address");

        SavingsGoal storage goal = savingsGoals[goalId];
        require(goal.depositToken != address(0), "Invalid deposit token");

        if(goal.currentAmount + amount >= goal.targetAmount) {
            goal.complete = true;
            emit GoalCompleted(msg.sender, goalId, goal.targetAmount);
        }

        _deposit(msg.sender, goal, amount);
        emit DepositMade(msg.sender, goalId, amount);
    }

    function withdraw(uint goalId) public goalExists(goalId) isGoalOwner(goalId) nonReentrant {
        SavingsGoal storage goal = savingsGoals[goalId];
        require(goal.currentAmount > 0, "No funds to withdraw");
        require(goal.depositToken != address(0), "Invalid deposit token");

        // uint power = 10 ** ERC20(goal.depositToken).decimals();
        // uint amount = goal.currentAmount;
        address depositToken = goal.depositToken;
        GoalzToken goalzToken = goalzTokens[depositToken];
        // require(address(goalzToken) != address(0), "Invalid GoalzToken");

        // Update interest index and calculate accured interest
        // (uint256 accruedInterest, uint256 newInterestIndex) = goalzToken.updateAndCalculateAccruedInterest(
        //     goal.currentAmount, goal.startInterestIndex);
        // goal.startInterestIndex = newInterestIndex;
        // uint256 withdrawAmount = goal.currentAmount + accruedInterest;

        // Update interest index and calculate accrued interest
        (uint256 accruedInterest, uint256 newInterestIndex) = goalzToken.updateAndCalculateAccruedInterest(goal.currentAmount, goal.startInterestIndex);
        goal.startInterestIndex = newInterestIndex;
        goal.currentAmount += accruedInterest;
        // mint interest to goal.saver
        goalzToken.mint(msg.sender, accruedInterest);
        uint withdrawAmount = goal.currentAmount;
        // uint power = 10 ** ERC20(depositToken).decimals();
        goal.currentAmount = 0;
        // Burn ONLY the current amount because the accrued interest was NOT minted
        goalzToken.burn(msg.sender, goal.currentAmount);
        // Withdraw the current amount + accrued interest
        lendingPool.withdraw(depositToken, withdrawAmount, msg.sender);

        emit WithdrawMade(msg.sender, goalId, withdrawAmount);
    }

    function automateDeposit(uint goalId, uint amount, uint frequency) external goalExists(goalId) {
        require(amount > 0, "Automated deposit amount should be greater than 0");
        require(frequency > 0, "Automated deposit frequency should be greater than 0");
        require(automatedDeposits[goalId].amount == 0, "Automated deposit already exists for this goal");

        AutomatedDeposit storage autoDeposit = automatedDeposits[goalId];
        autoDeposit.amount = amount;
        autoDeposit.frequency = frequency;
        autoDeposit.lastDeposit = block.timestamp; 

        bytes memory execData = abi.encodeWithSelector(this.automatedDeposit.selector, goalId);
        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2), 
            args: new bytes[](2) 
        });

        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.TRIGGER;
        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _timeTriggerModuleArg(uint128(block.timestamp), uint128(CHECK_DURATION)); // check every minute

        bytes32 taskId = _createTask(
            address(this),
            execData,
            moduleData,
            address(0)
        );

        autoDeposit.gelatoTaskId = taskId;

        emit AutomatedDepositCreated(msg.sender, goalId, amount, frequency);
    }

    function cancelAutomatedDeposit(uint goalId) external goalExists(goalId) isGoalOwner(goalId) {
        _cancelAutomatedDeposit(goalId);
    }

    function _cancelAutomatedDeposit(uint goalId) internal {
        AutomatedDeposit memory autoDeposit = automatedDeposits[goalId];
        if (autoDeposit.gelatoTaskId != bytes32(0)) {
            _cancelTask(autoDeposit.gelatoTaskId);
            delete automatedDeposits[goalId];
            emit AutomatedDepositCanceled(msg.sender, goalId);
        }
    }


    function automatedDeposit(uint goalId) external goalExists(goalId) {
        AutomatedDeposit storage _automatedDeposit = automatedDeposits[goalId];
        uint amount = _automatedDeposit.amount;
        require(amount > 0, "No automated deposit for this goal");
        require(block.timestamp >= _automatedDeposit.lastDeposit + _automatedDeposit.frequency, "Deposit frequency not reached yet");

        SavingsGoal storage goal = savingsGoals[goalId];
        require(goal.currentAmount + amount <= goal.targetAmount, "Automated deposit exceeds the goal target amount");

        _deposit(ownerOf(goalId), goal, amount);

        if(goal.currentAmount >= goal.targetAmount) {
            goal.complete = true;
            emit GoalCompleted(ownerOf(goalId), goalId, goal.targetAmount);
        }

        _automatedDeposit.lastDeposit = block.timestamp;

        emit DepositMade(ownerOf(goalId), goalId, amount);
    }

    function _deposit(address account, SavingsGoal storage goal, uint amount) internal nonReentrant {
        // address _depositToken = goal.depositToken;
        // require(_depositToken != address(0), "Invalid deposit token");
        address depositToken = goal.depositToken;
        address savingToken = goal.savingToken;
        require(depositToken != address(0) && savingToken != address(0), "Invalid tokens");
        require(account != address(0), "Invalid account address");
        require(amount > 0, "Deposit amount should be greater than 0");
        require(IERC20(depositToken).balanceOf(account) >= amount, "Insufficient balance");

        IERC20(depositToken).safeTransferFrom(account, address(this), amount);

        uint256 amountOut;
        if (depositToken != savingToken) {
            amountOut = _swapTokens(depositToken, savingToken, amount);
        } else {
            amountOut = amount;
        }

        GoalzToken goalzToken = goalzTokens[savingToken];

        (uint256 accruedInterest, uint256 newInterestIndex) = goalzToken.updateAndCalculateAccruedInterest(
            goal.currentAmount,
            goal.startInterestIndex
        );

        goal.currentAmount += accruedInterest;
        goal.startInterestIndex = newInterestIndex;

        goalzToken.mint(account, amountOut + accruedInterest);
        goal.currentAmount += (amountOut + accruedInterest);
        _depositToAave(savingToken, amountOut);
    }

    function _depositToAave(address token, uint amount) internal {
        IERC20(token).approve(address(lendingPool), amount);
        lendingPool.deposit(token, amount, address(this), 0);
    }

    function _swapTokens(address tokenIn, address tokenOut, uint256 amountIn) internal returns (uint256 amountOut) {
        uint256 expectedAmountOut = _getQuote(tokenIn, tokenOut, amountIn);
        uint256 minAmountOut = expectedAmountOut * (10000 - SLIPPAGE_TOLERANCE) / 10000;

        IERC20(tokenIn).approve(address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);
    }

    function _getQuote(address tokenIn, address tokenOut, uint256 amountIn) internal view returns (uint256) {
        return 0;
    }

    function _withdrawFromAave(address token, uint amount) internal {
        lendingPool.withdraw(token, amount, address(this));
    }

    function balanceOf(uint _goalId) internal returns (uint) {
        SavingsGoal storage _goal = savingsGoals[_goalId];
        address _depositToken = _goal.depositToken;
        // Use the next interest index to calculate the current amount
        goalzTokens[_depositToken].updateInterestIndex();
        
        uint256 currentInterestIndex = goalzTokens[_depositToken].getInterestIndex();
        // goalzTokens[_depositToken].getNextInterestIndex();
        
        uint256 balance =  _goal.currentAmount * 10 ** ERC20(_depositToken).decimals() + (currentInterestIndex - _goal.startInterestIndex);
        _goal.startInterestIndex = currentInterestIndex;
        return balance;
    }

    /// @notice Disable transfers of tokens except for minting and burning
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable) {
        require(from == address(0) || to == address(0), "Token transfer is not allowed");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function depositFundsTo1Balance(uint256 amount, address token) external {
        _depositFunds1Balance(amount, token, msg.sender);
    }
}
