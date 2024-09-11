# Audit Report for Goalz Smart Contracts

**Auditor:** Craig Smith  
**Date:** 11th September 2024  
**Time constraint:** 2 hours exploratory audit (not a full audit)

## Scope

1) address Goalz.sol and GoalzToken.sol within this audit. 
2) The mocks are out of scope for this audit.
3) Gelato is out of scope for this audit.
4) YieldGoalzUSD.sol is out of scope for this audit. (no tests exist)

## Test Coverage

Coverage is moderate (more branch coverage is needed), and tests are not comprehensive. 

| File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|---------------------------|---------|----------|---------|---------|-----------------|
| contracts/                | 75.73   | 50       | 65.63   | 72.86   |                 |
| Goalz.sol                 | 86.11   | 50       | 73.68   | 86.02   | ... 240,241,251 |
| GoalzToken.sol            | 88.89   | 75       | 77.78   | 91.67   | 48,62           |
| IGoalzToken.sol           | 100     | 100      | 100     | 100     |                 |
| YieldGoalzUSD.sol         | 0       | 0        | 0       | 0       | ... 73,74,75,76 |
| contracts/gelato/         | 25      | 0        | 29.41   | 30.3    |                 |
| AutomateReady.sol         | 37.5    | 0        | 25      | 46.15   | ... 58,59,61,70 |
| AutomateTaskCreator.sol   | 20      | 0        | 33.33   | 20      | ... 115,119,121 |
| Ops.sol                   | 100     | 100      | 0       | 100     |                 |
| Types.sol                 | 100     | 100      | 100     | 100     |                 |
| contracts/mocks/          | 84      | 37.5     | 80      | 88.57   |                 |
| ERC20Mock.sol             | 100     | 100      | 100     | 100     |                 |
| MockAaveToken.sol         | 100     | 100      | 100     | 100     |                 |
| MockGelato.sol            | 75      | 100      | 66.67   | 75      | 23,47           |
| MockLendingPool.sol       | 83.33   | 37.5     | 75      | 88.24   | 41,42           |
| All files                 | 67.95   | 42.55    | 60.87   | 68.75   |                 |


## Audit Report for Goalz.sol

1. Reentrancy Risk:
   - The `withdraw` function follows the checks-effects-interactions pattern, which is good. However, consider using OpenZeppelin's `ReentrancyGuard` for additional protection.

2. Access Control:
   - The `automatedDeposit` function can be called by anyone. Consider adding access control to ensure only authorized entities (e.g., Gelato) can call this function.

3. Input Validation:
   - In `setGoal`, consider adding a check for a maximum `targetAmount` to prevent unreasonably large goals.

4. Gas Optimization:
   - The `_addDepositToken` function creates a new `GoalzToken` for each deposit token. This could be gas-intensive if many deposit tokens are added.

5. Event Emission:
   - Consider emitting an event when a goal is completed (when `currentAmount == targetAmount`).

6. Potential DOS:
   - The `automateDeposit` function creates a Gelato task for each automated deposit. If many users create automated deposits, it could potentially lead to high gas costs or even a DOS situation.

7. Timestamp precision:
   - The `CHECK_DURATION` is defined in milliseconds for Gelato, but Solidity works with seconds. The current implementation is not affected by this, but may be something to consider for maintenance.

8. Unused Variable:
   - The `data` parameter in `_beforeTokenTransfer` is unused.

9. Incomplete Implementation:
    - The TODO comment in `_beforeTokenTransfer` suggests that token transferability is not finalized.

10. Potential Centralization Risk:**
    - The contract owner has significant control over the system, including the ability to add deposit tokens.


## Recommendation for AutomateReady.sol - line 46

Add an acceptance return of the value isDeployed in the constructor of AutomateReady.sol


## GoalzToken.sol

1. Centralization risk:
   - The `mint` and `burn` functions are onlyOwner() which is a centralization risk, low severity

2. Reentrancy risk:
   - The `mint` and `burn` functions are not doing the checks-effects-interactions pattern, which could potentially lead to reentrancy attacks, but this is not a problem in the current implementation, because of the checks in the calling functions.  

3. Missing zero address checks: see 2.

Mint and burn functions - all the places where mint/burn are called, the amount has been checked for zero, and the account has been checked for the zero address, but what about future functions that might call mint/burn?

## Recommendations for Goalz

1. While it is currently consistent, checks for token address and amount (deposit/mint and withdraw/burn) done at different levels of the call stack, revisiting the design to verify that all checks are done once and only once, and made explicit so future developers will know the design paradigm for checks would add to maintainability.

2. Additional checks could be added to mint and burn functions to check for bad addresses and amounts, but have already been checked by calling functions.

   - GoalzToken.sol - line 34, Add a require to check if the depositToken is the zero address.
   - GoalzToken.sol - line 35, Add a require to check if the aToken is the zero address.
   - GoalzToken.sol - line 48, Add a require to check if the amount is greater than 0.
   - GoalzToken.sol - line 50, Add a require to check if the account is not the zero address.
   - GoalzToken.sol - line 52, Add a require to check if the amount is greater than 0.
   - GoalzToken.sol - line 54, Add a require to check if the balance of the account is greater than or equal to the amount.

3. Implement `ReentrancyGuard` from OpenZeppelin for critical functions like `mint` and `burn` and 'withdraw'.

4. automatedDeposit is a public function - Add access control for Gelato, to the `automatedDeposit` function:

```solidity
function automatedDeposit(uint goalId) external goalExists(goalId) onlyAutomation {
    // ... existing code ...
}

modifier onlyAutomation() {
    require(msg.sender == automationAddress, "Only automation contract can call this function");
    _;
}
```
