// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint 1000 tokens to the deployer
        _mint(msg.sender, 1000000000000000000000);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}