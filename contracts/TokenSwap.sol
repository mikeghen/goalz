// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import './lib/TransferHelper.sol';
import './interfaces/ISwapRouter.sol';

contract TokenSwap {
    address public constant routerAddr = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter public immutable swapRouter = ISwapRouter(routerAddr);

    // address public tokenA = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    // address public tokenB = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public tokenA;
    address public tokenB;

    // For this example, we will set the pool fee to 0.3%.
    uint24 public constant poolFee = 3000;

    /// @notice swapExactInputSingle swaps a fixed amount of DAI for a maximum possible amount of WETH9
    /// using the 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its tokenA for this function to succeed.
    /// @param amountIn The exact amount of tokenA that will be swapped for tokenB.
    /// @return amountOut The amount of tokenB received.
    function swapExactInputSingle(uint256 amountIn, address _tokenA, address _tokenB) external returns (uint256 amountOut) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        
        // Approve the router to spend DAI.
        TransferHelper.safeApprove(tokenA, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    /// @notice swapExactOutputSingle swaps a minimum possible amount of tokenA for a fixed amount of tokenB.
    /// @dev The calling address must approve this contract to spend its tokenA for this function to succeed. As the amount of input tokenA is variable,
    /// the calling address will need to approve for a slightly higher amount, anticipating some variance.
    /// @param amountOut The exact amount of tokenB to receive from the swap.
    /// @param amountInMaximum The amount of tokenA we are willing to spend to receive the specified amount of tokenB.
    /// @return amountIn The amount of tokenA actually spent in the swap.
    function swapExactOutputSingle(uint256 amountOut, uint256 amountInMaximum) external returns (uint256 amountIn) {
        // Transfer the specified amount of tokenA to this contract.
        // TransferHelper.safeTransferFrom(tokenA, msg.sender, address(this), amountInMaximum);

        // Approve the router to spend the specifed `amountInMaximum` of tokenA.
        // In production, you should choose the maximum amount to spend based on oracles or other data sources to acheive a better swap.
        TransferHelper.safeApprove(tokenA, address(swapRouter), amountInMaximum);

        ISwapRouter.ExactOutputSingleParams memory params =
            ISwapRouter.ExactOutputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                sqrtPriceLimitX96: 1
            });

        // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
        amountIn = swapRouter.exactOutputSingle(params);

        // For exact output swaps, the amountInMaximum may not have all been spent.
        // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
        if (amountIn < amountInMaximum) {
            TransferHelper.safeApprove(tokenA, address(swapRouter), 0);
            TransferHelper.safeTransfer(tokenA, msg.sender, amountInMaximum - amountIn);
        }
    }
}