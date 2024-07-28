// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AaveTokenMock is ERC20 {
    uint256 public interestRatePerSecond; // 12% APY in seconds
    uint256 public lastUpdateTimestamp;
    mapping(address => uint256) public principalBalances;

    constructor(string memory name, string memory symbol, uint256 _interestRatePerSecond) ERC20(name, symbol) {
        interestRatePerSecond = _interestRatePerSecond;
        lastUpdateTimestamp = block.timestamp;
    }

    function mint(address account, uint256 amount) external {
        updateInterest(account);
        _mint(account, amount);
        principalBalances[account] += amount;
    }

    function burn(address account, uint256 amount) external {
        updateInterest(account);
        _burn(account, amount);
        principalBalances[account] -= amount;
    }

    function updateInterest(address account) public {
        uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
        uint256 interest = (principalBalances[account] * interestRatePerSecond * timeElapsed) / 1e18;
        _mint(account, interest);
        lastUpdateTimestamp = block.timestamp;
    }

    function balanceOf(address account) public view override returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdateTimestamp;
        uint256 interest = (principalBalances[account] * interestRatePerSecond * timeElapsed) / 1e18;
        return super.balanceOf(account) + interest;
    }
}
