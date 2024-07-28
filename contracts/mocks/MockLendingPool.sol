// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AaveTokenMock.sol";

contract LendingPoolMock {
    using SafeERC20 for IERC20;

    mapping(address => address) public aTokens;
    mapping(address => uint256) public balances;

    event Deposit(address indexed token, address indexed user, uint256 amount);
    event Withdraw(address indexed token, address indexed user, uint256 amount);

    function setAToken(address token, address aToken) external {
        aTokens[token] = aToken;
    }

    function deposit(address token, uint256 amount, address onBehalfOf, uint16 /*referralCode*/) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[onBehalfOf] += amount;
        AaveTokenMock(aTokens[token]).mint(onBehalfOf, amount);
        emit Deposit(token, onBehalfOf, amount);
    }

    function withdraw(address token, uint256 amount, address to) external returns (uint256) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;

        AaveTokenMock aToken = AaveTokenMock(aTokens[token]);
        aToken.burn(msg.sender, amount);
        uint256 balanceWithInterest = aToken.balanceOf(msg.sender);
        aToken.burn(msg.sender, balanceWithInterest - amount);

        IERC20(token).safeTransfer(to, balanceWithInterest);
        emit Withdraw(token, msg.sender, balanceWithInterest);

        return balanceWithInterest;
    }

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }
}
