// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockQuoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external view returns (uint256 amountOut) {
        // Return a mock quote
        return amountIn * 9 / 10000; // Assume 1 USDC = 0.0009 ETH
    }
}