// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GoalzToken is ERC20, Ownable {

    address public depositToken;
    address public aToken;

    constructor(string memory name, string memory symbol, address _depositToken, address _aToken) ERC20(name, symbol) {
        require(_depositToken != address(0), "Deposit token cannot be zero address");
        require(_aToken != address(0), "aToken cannot be zero address");
        depositToken = _depositToken;
        aToken = _aToken;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        require(amount > 0, "Mint amount must be greater than 0");
        require(account != address(0), "Cannot mint to zero address");
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        require(amount > 0, "Burn amount must be greater than 0");
        require(account != address(0), "Cannot burn from zero address");
        require(balanceOf(account) >= amount, "Insufficient balance to burn");
        _burn(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return ERC20(depositToken).decimals();
    }

    // Disable transfers
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Disabled");
    }
}