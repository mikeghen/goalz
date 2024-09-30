// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

contract TokenTracking {
    using Counters for Counters.Counter;
    Counters.Counter private count;

    struct Action {
        address token;
        uint256 amount;
        uint256 timestamp;
        string eventType;
    }

    address public immutable savings_token;
    address public immutable deposit_token;

    mapping (address => mapping (uint256 => Action)) public history;

    constructor (address _savingsToken, address _depositToken) {
        savings_token = _savingsToken;
        deposit_token = _depositToken;
    }

    function deposit(uint256 amount, address owner) public {
        count.increment();
        history[owner][count.current()] = Action(deposit_token, amount, block.timestamp, "deposit");
    }

    function saving(uint256 amount, address owner) public {
        count.increment();
        history[owner][count.current()] = Action(savings_token, amount, block.timestamp, "saving");
    }
}