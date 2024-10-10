// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockAaveToken.sol";
import "hardhat/console.sol";

contract MockLendingPool {
    uint256 public lastDepositAmount;
    address public lastDepositToken;
    uint256 public lastWithdrawAmount;
    address public lastWithdrawToken;
    mapping(address => address) public aTokens; // Maps deposit tokens to their corresponding aTokens
    uint256 constant interestRate = 1.05 * 10 ** 27; // 5% per year, computed every second

    function setAToken(address depositToken, address aToken) external {
        aTokens[depositToken] = aToken;
    }

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 /* referralCode */) external {
        require(aTokens[asset] != address(0), "No aToken set for this asset");
        lastDepositAmount = amount;
        lastDepositToken = asset;
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        MockAaveToken(aTokens[asset]).mint(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(aTokens[asset] != address(0), "No aToken set for this asset");
        MockAaveToken aToken = MockAaveToken(aTokens[asset]);
        require(aToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        lastWithdrawAmount = amount;
        lastWithdrawToken = asset;
        console.log("message.sender: ", msg.sender);
        aToken.burn(msg.sender, amount);
        IERC20(asset).transfer(to, amount);
        return amount;
    }

    function getReserveNormalizedIncome(address asset) external view returns (uint256) {
        require(aTokens[asset] != address(0), "No aToken set for this asset");
        return MockAaveToken(aTokens[asset]).balanceOf(address(this));
    }
    // @dev this is a mock function to return the liquidity index of the asset
    // @dev getReserveData is the actual function that should be used to get the liquidity index
    // @dev this mock function only returns the liquidity index of the asset
    // @dev getReserveData returns multiple values, this mock function only returns the liquidity index
    // @dev check the Aave documentation to see what all the values are
    // @param asset the address of the asset
    // @return the liquidity index of the asset
    function getReserveData(address asset) external view returns (uint256 liquidityIndex) {
        // interest 5% per year, compute every second
        liquidityIndex = block.timestamp * interestRate;
        return liquidityIndex;
    }
}