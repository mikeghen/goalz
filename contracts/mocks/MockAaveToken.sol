// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockAaveToken is ERC20 {
    uint256 public interestRatePerSecond;
    uint256 public lastUpdateTimestamp;
    mapping(address => uint256) public principalBalances;
    uint256 nextBalanceOf; // Used to mock the balanceOf function

    constructor(string memory name, string memory symbol, uint256 _interestRatePerSecond) ERC20(name, symbol) {
        interestRatePerSecond = _interestRatePerSecond;
        lastUpdateTimestamp = block.timestamp;
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
        principalBalances[account] += amount;
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
        principalBalances[account] -= amount;
    }

    function mockBalanceOf(uint amount) external {
        nextBalanceOf = amount;
    }

    function balanceOf(address) public view override returns (uint256) {
        return nextBalanceOf;
    }
}
