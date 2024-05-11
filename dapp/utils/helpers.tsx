import { ethers } from "ethers";

export const formatTokenAmount = (
  amount: string,
  tokenDecimals: number,
  displayDecimals: number
): string => {
  // Format it as a number
  let result = Number(ethers.utils.formatUnits(amount, tokenDecimals));
  // Floor it with rounding
  result = Math.floor(result * Math.pow(10, displayDecimals)) / Math.pow(10, displayDecimals);
  
  if (result === 0 && Number(amount) != 0) {
    // Recursively call this function with one more decimal place
    return formatTokenAmount(amount, tokenDecimals, displayDecimals + 1);
  }

  return result.toFixed(displayDecimals);
};
