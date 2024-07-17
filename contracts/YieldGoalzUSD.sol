// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldGoalzUSD is ERC20, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public depositToken;

    struct Deposit {
        uint amount;
        uint startYieldIndex;
    }

    ERC20 public yieldToken;
    uint public yieldIndex = 0;
    uint public totalDeposits = 0;
    uint public previousYieldTokenBalance;
    uint public yieldtokenBalanceScaler = 1e18;
    uint public lastYieldCalculation = block.timestamp;

    mapping(address => Deposit) public deposits;
    mapping(address => uint) public yieldBalances;

    constructor(ERC20 _yieldToken) ERC20("Goalz USD", "glzUSD") {
        yieldToken = _yieldToken;
     }

    function mint(address account, uint256 amount) external onlyOwner {
        IERC20 safeToken = IERC20(yieldToken);
        safeToken.safeTransferFrom(msg.sender, address(this), amount);
        // If this user has a deposit
        if (deposits[account].amount > 0) {
            // Calculate the yield since the last time the yield was calculated
            _increaseYield();
            // Calculate the yield for this user
            uint yield = (yieldIndex - deposits[account].startYieldIndex) * deposits[account].amount / yieldtokenBalanceScaler;
            // Add the yield to the yield balance
            yieldBalances[account] += yield;
            // Update the yield start index
            deposits[account].startYieldIndex = yieldIndex;
            deposits[account].amount += amount;
        } else {
            // If this is the first deposit for this user, set the yield start index
            deposits[account] = Deposit(amount, yieldIndex);
        }
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        IERC20 safeToken = IERC20(yieldToken);
        // Calculate the yield since the last time the yield was calculated
        _increaseYield();
        // Calculate the yield for this user
        uint yield = (yieldIndex - deposits[account].startYieldIndex) * deposits[account].amount / yieldtokenBalanceScaler;
        // Add the yield to the yield balance
        yieldBalances[account] += yield;
        // Update the yield start index and amount on their deposit
        deposits[account].startYieldIndex = yieldIndex;
        deposits[account].amount -= amount;
        // Burn tokens and return yield tokens
        _burn(account, amount);
        safeToken.safeTransfer(account, amount);
    }

    // TODO: Claim yield method

    function _increaseYield() public {
        uint currentYieldTokenBalance = yieldToken.balanceOf(address(this));
        uint changeInBalance = currentYieldTokenBalance - previousYieldTokenBalance;
        changeInBalance = changeInBalance * yieldtokenBalanceScaler;
        yieldIndex += changeInBalance / totalDeposits;
    }

}