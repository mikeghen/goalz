// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GoalzToken is ERC20, Ownable {

    address public depositToken;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) { }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
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