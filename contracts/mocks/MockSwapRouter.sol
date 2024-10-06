// MockSwapRouter.sol
pragma solidity ^0.8.0;

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract MockSwapRouter {
    uint256 public amountOut;

    function setAmountOut(uint256 _amountOut) external {
        amountOut = _amountOut;
    }

    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external returns (uint256) {
        return amountOut; s
    }
}