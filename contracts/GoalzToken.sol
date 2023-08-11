// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GoalzToken is ERC20, Ownable {

    IERC20 public depositToken;
    mapping(address => uint) lastDepositTime;
    mapping(address => uint) public depositPoints;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) { }

    function mint(address account, uint256 amount) external onlyOwner {
        if(lastDepositTime[account] != 0) {
            uint depositPointsEarned = (block.timestamp - lastDepositTime[account]) / balanceOf(account);
            depositPoints[account] += depositPointsEarned;
        }
        lastDepositTime[account] = block.timestamp;
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        uint balanceBefore = balanceOf(account);
        _burn(account, amount);
        uint depositPointsEarned = (block.timestamp - lastDepositTime[account]) / balanceBefore;
        depositPoints[account] += depositPointsEarned;
    }

    function getDepositPoints(address account) public view returns (uint) {
        uint depositPointsPending = (block.timestamp - lastDepositTime[account]) / balanceOf(account);
        return depositPoints[account] + depositPointsPending;
    }
}