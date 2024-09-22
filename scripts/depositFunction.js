const hre = require("hardhat");
const networkAddresses = require("../config/networkAddresses.js");

async function main() {
  // Get the network-specific addresses
  const network = hre.network.name;
  const addresses = networkAddresses[network];

  if (!addresses) {
    throw new Error(`No addresses found for network: ${network}`);
  }

  // Use USDC address from the imported module
  const { USDC, GOALZ } = addresses;

  // Check if GOALZ address is set
  if (!GOALZ || GOALZ === "0x0") {
    throw new Error(`Goalz contract address not set for network: ${network}`);
  }

  // Get the Goalz contract instance
  const Goalz = await hre.ethers.getContractAt("Goalz", GOALZ);

  // Set up deposit parameters
  const goalId = 0; // Assuming the first goal has ID 0
  const depositAmount = hre.ethers.parseUnits("1", 6); // Depositing 1 USDC (6 decimals)

  console.log("Depositing to goal with the following parameters:");
  console.log("Goal ID:", goalId);
  console.log("Deposit Amount:", hre.ethers.formatUnits(depositAmount, 6), "USDC");

  // First, approve the Goalz contract to spend USDC
  const USDC_Contract = await hre.ethers.getContractAt("IERC20", USDC);
  const approveTx = await USDC_Contract.approve(GOALZ, depositAmount);
  console.log("Approval transaction sent. Transaction hash:", approveTx.hash);
  console.log("Waiting for confirmation...");
  
  const approvalReceipt = await approveTx.wait();
  if (approvalReceipt.status === 1) {
    console.log("Approval confirmed. Transaction hash:", approvalReceipt.transactionHash);
  } else {
    throw new Error("Approval transaction failed");
  }

  // Call deposit function
  const tx = await Goalz.deposit(goalId, depositAmount, { gasLimit: 1000000 });
  console.log("Deposit transaction sent. Waiting for confirmation...");

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Deposit successful!");
  console.log("Transaction hash:", receipt.hash);

  const depositMadeEvent = receipt.logs
    .map((log) => {
      try {
        return Goalz.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find((parsedLog) => parsedLog && parsedLog.name === "DepositMade");

  if (depositMadeEvent) {
    const [saver, goalId, amount] = depositMadeEvent.args;
    console.log("Deposit details:");
    console.log("Saver:", saver);
    console.log("Goal ID:", goalId.toString());
    console.log("Amount deposited:", hre.ethers.formatUnits(amount, 6), "USDC");
  } else {
    console.log("DepositMade event not found in the transaction logs");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
