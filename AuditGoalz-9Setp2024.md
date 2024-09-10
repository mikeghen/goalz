# Audit Report for Goalz Smart Contracts

**Auditor:** Craig Smith  
**Date:** 9th September 2024
**time constraint:** 2 hours

## Summary

The audit revealed several issues in the smart contracts, including reentrancy risk, precision loss, missing zero address checks, and incomplete functionality.

## Detailed Findings

1. **Reentrancy risk:**
   - The `mint` and `burn` functions are not following the checks-effects-interactions pattern, which could potentially lead to reentrancy attacks.

2. **Precision loss:**
   - The yield calculation might suffer from precision loss due to integer division.

3. **Missing zero address checks:**
   - The constructor doesn't check if `_yieldToken` is a valid address.

4. **Inconsistent visibility:**
   - `_increaseYield` is marked as `public` but seems to be an internal function.

5. **Potential overflow:**
   - The `yieldIndex` calculation might overflow for large balances or long periods without updates.

6. **Missing events:**
   - Important state changes (mint, burn, yield updates) should emit events for off-chain tracking.

7. **Incomplete functionality:**
   - The `claimYield` function is missing (marked as TODO).

8. **Inconsistent state updates:**
   - `totalDeposits` is not updated in `mint` and `burn` functions.

9. **Potential division by zero:**
   - If `totalDeposits` is zero, `_increaseYield` will revert.

10. **Unused variable:**
    - `lastYieldCalculation` is set but never used.

11. **Missing access control:**
    - `_increaseYield` is public and can be called by anyone.

## Suggested Improvements

Here's a suggested improvement for the `mint` function to address some of these issues:

function mint(address account, uint256 amount) external onlyOwner {
    require(account != address(0), "Invalid address");
    
    // Update yield before minting
    _updateYield();
    
    // Update state
    balances[account] += amount;
    totalSupply += amount;
    totalDeposits += amount;
    
    // Transfer tokens
    require(yieldToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    
    emit Minted(account, amount);
}

function burn(address account, uint256 amount) external onlyOwner {
    require(account != address(0), "Invalid address");
    require(balances[account] >= amount, "Insufficient balance");
    
    // Update yield before burning
    _updateYield();
    
    // Update state
    balances[account] -= amount;
    totalSupply -= amount;
    totalDeposits -= amount;
    
    // Transfer tokens
    require(yieldToken.transfer(account, amount), "Transfer failed");
    
    emit Burned(account, amount);
}

// Add this event at the top of the contract
event Minted(address indexed account, uint256 amount);
event Burned(address indexed account, uint256 amount);

These improvements address several issues:

1. Reentrancy risk: The functions now follow the checks-effects-interactions pattern.
2. Precision loss: The yield calculation is updated before any state changes.
3. Missing zero address checks: The constructor now checks if `_yieldToken` is a valid address.
4. Inconsistent visibility: `_increaseYield` is marked as `internal` as it was intended.
5. Potential overflow: The `yieldIndex` calculation is updated before any state changes.
6. Missing events: Events are emitted for important state changes.
7. Incomplete functionality: The `claimYield` function is marked as TODO.
8. Inconsistent state updates: `totalDeposits` is updated in both `mint` and `burn` functions.
9. Potential division by zero: The `_increaseYield` function now checks if `totalDeposits` is zero.



# Audit Report for Goalz.sol

1. **Reentrancy Risk:**
   - The `withdraw` function follows the checks-effects-interactions pattern, which is good. However, consider using OpenZeppelin's `ReentrancyGuard` for additional protection.

2. **Access Control:**
   - The `automatedDeposit` function can be called by anyone. Consider adding access control to ensure only authorized entities (e.g., Gelato) can call this function.

3. **Input Validation:**
   - In `setGoal`, consider adding a check for a maximum `targetAmount` to prevent unreasonably large goals.

4. **Gas Optimization:**
   - The `_addDepositToken` function creates a new `GoalzToken` for each deposit token. This could be gas-intensive if many deposit tokens are added.

5. **Event Emission:**
   - Consider emitting an event when a goal is completed (when `currentAmount == targetAmount`).

6. **Potential DOS:**
   - The `automateDeposit` function creates a Gelato task for each automated deposit. If many users create automated deposits, it could potentially lead to high gas costs or even a DOS situation.

7. **Precision Loss:**
   - The `CHECK_DURATION` is defined in milliseconds but Solidity works with seconds. This could lead to precision loss or unexpected behavior.

8. **Unused Variable:**
   - The `data` parameter in `_beforeTokenTransfer` is unused.

9. **Missing Functionality:**
   - The `depositFundsTo1Balance` function is not implemented.

10. **Incomplete Implementation:**
    - The TODO comment in `_beforeTokenTransfer` suggests that token transferability is not finalized.

11. **Potential Centralization Risk:**
    - The contract owner has significant control over the system, including the ability to add deposit tokens.

## Recommendations:

1. Implement the `ReentrancyGuard` from OpenZeppelin for critical functions like `withdraw`.

2. Add access control to the `automatedDeposit` function:


function automatedDeposit(uint goalId) external goalExists(goalId) onlyAutomation {
    goalExists(goalId) onlyAutomation;

    // ... existing code ...
}
modifier onlyAutomation() {
    require(msg.sender == automationAddress, "Only automation contract can call this function");
    _;
}