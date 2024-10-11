// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGoalzToken {
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function getInterestIndex() external view returns (uint256);
}