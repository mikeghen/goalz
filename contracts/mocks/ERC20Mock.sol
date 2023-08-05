// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor() ERC20("Mock ERC20", "MERC20") {
        _mint(msg.sender, 1000000000000000000000000000);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}