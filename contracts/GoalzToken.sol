// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {MockLendingPool} from "./mocks/MockLendingPool.sol";
import "hardhat/console.sol";

/// @title GoalzToken
/// @notice ERC20 token representing a deposit into Goalz. This contract is used for tracking the principal deposits
/// and interest accrued by the owner. This contract also holds information used to calculate yields for Goalz.
/// @dev Consider the following:
/// - The owner is assumed to be holding the underlying deposit token, and depositing them to Aave.
/// - The interest index is a normalized value that represents the interest accrued on 1 deposit token.
/// - The balance checkpoint is used to calculate the interest index, the change in aToken balance is used to update the interest index.
/// @dev Future work should get these tokens to work like rebasing a tokens themselves. It could be a wrapper around the
/// getNormalizedIncome function in Aave. 
contract GoalzToken is ERC20, ReentrancyGuard, Ownable {
//    uint256 constant power = 10 ** 18;
    address public depositToken;
    address public aToken;
    uint256 public interestIndex;
    uint256 public balanceCheckpoint;
    uint256 constant interestRate = 1.585489495 * 10 ** 20; // 5% per year, computed every second  
//  MockLendingPool public mLendingPool;

    event InterestIndexUpdated(uint256 prevInterestIndex, uint256 newInterestIndex);
    event BalanceCheckpointUpdated(uint256 prevBalanceCheckpoint, uint256 newBalanceCheckpoint);

    /// @dev Checks for zero addresses are performed in the Goalz contract
    constructor(string memory name, string memory symbol, address _depositToken, address _aToken) ERC20(name, symbol) { 
        depositToken = _depositToken;
        aToken = _aToken;
        getNextInterestIndex();
        // interestIndex = 10 ** ERC20(depositToken).decimals();
    }

    /// @dev Checks for zero address, zero amount, and sufficient balance are performed in the Goalz contract
    function mint(address account, uint256 amount) external onlyOwner nonReentrant {
        if (totalSupply() == 0) {
            balanceCheckpoint = amount;
            emit BalanceCheckpointUpdated(0, balanceCheckpoint);
        }
        _updateInterestIndex();
        _mint(account, amount);
    }

    /// @dev Checks for zero amount and sufficient balance are performed in the Goalz contract
    function burn(address account, uint256 amount) external onlyOwner nonReentrant {
        _updateInterestIndex();
        _burn(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return ERC20(depositToken).decimals();
    }

    function getInterestIndex() public view returns (uint256) {
        return interestIndex;
    }

    function getNextInterestIndex() public  {
    //    interestIndex = mLendingPool.getReserveData(aToken);
        
            interestIndex = block.timestamp * interestRate;
    
    }

    function updateInterestIndex() external onlyOwner {
        _updateInterestIndex();
    }

    function _updateInterestIndex() internal {

        getNextInterestIndex();
              
//        emit InterestIndexUpdated(_prevIndex, interestIndex);
    }

    function updateAndCalculateAccruedInterest(uint256 amount, uint256 startInterestIndex) external onlyOwner returns (uint256 interestAccrued, uint256 currentInterestIndex) {
        _updateInterestIndex();
        currentInterestIndex = interestIndex;
        interestAccrued = (amount * (currentInterestIndex - startInterestIndex)) / (10 ** ERC20(depositToken).decimals());
    }
    
    // Disable transfers
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Disabled");
    }
}