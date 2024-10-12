// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGoalzToken {
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function updateAndCalculateAccruedInterest(uint256 amount, uint256 startInterestIndex) external returns (uint256);
    function getNextInterestIndex() external returns (uint256);
    function getInterestIndex() external view returns (uint256);
}