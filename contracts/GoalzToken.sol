// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GoalzToken
/// @notice ERC20 token representing a deposit into Goalz. This contract is used for tracking the principal deposits
/// and interest accrued by the owner. This contract also holds information used to calculate yields for Goalz.
/// @dev Consider the following:
/// - The owner is assumed to be holding the underlying deposit token, and depositing them to Aave.
/// - The interest index is a normalized value that represents the interest accrued on 1 deposit token.
/// - The balance checkpoint is used to calculate the interest index, the change in aToken balance is used to update the interest index.
/// @dev Future work should get these tokens to work like rebasing a tokens themselves. It could be a wrapper around the
/// getNormalizedIncome function in Aave. 
contract GoalzToken is ERC20, Ownable {

    address public depositToken;
    address public aToken;
    uint256 public interestIndex;
    uint256 public balanceCheckpoint;

    event InterestIndexUpdated(uint256 newInterestIndex);
    event BalanceCheckpointUpdated(uint256 newBalanceCheckpoint);

    constructor(string memory name, string memory symbol, address _depositToken, address _aToken) ERC20(name, symbol) { 
        require(_depositToken != address(0), "GoalzToken: depositToken is the zero address");
        depositToken = _depositToken;
        aToken = _aToken;
        interestIndex = 10 ** ERC20(depositToken).decimals();
    }

    function mint(address account, uint256 amount) external onlyOwner {
        if (totalSupply() == 0) {
            balanceCheckpoint = amount;
            emit BalanceCheckpointUpdated(balanceCheckpoint);
        }
        _updateInterestIndex();
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _updateInterestIndex();
        _burn(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return ERC20(depositToken).decimals();
    }

    function getInterestIndex() public view returns (uint256) {
        return interestIndex;
    }

    function getNextInterestIndex() public view returns (uint256) {
        // Owner is assumed to be holding aTokens 
        uint256 currentBalance = ERC20(aToken).balanceOf(owner());
        return interestIndex * currentBalance / balanceCheckpoint;
    }

    function updateInterestIndex() external onlyOwner {
        _updateInterestIndex();
    }

    function _updateInterestIndex() internal {
        // Owner is assumed to be holding aTokens 
        uint _prevBalanceCheckpoint = balanceCheckpoint;
        balanceCheckpoint = ERC20(aToken).balanceOf(owner());

        if (balanceCheckpoint > _prevBalanceCheckpoint) {
            interestIndex = interestIndex + (balanceCheckpoint - _prevBalanceCheckpoint) * 10 ** ERC20(aToken).decimals() / _prevBalanceCheckpoint;
        }

        emit 
    }

    // Disable transfers
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Disabled");
    }
}