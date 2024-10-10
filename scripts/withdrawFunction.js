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

  // Get the signer
  const signers = await hre.ethers.getSigners();
  console.log("Number of signers:", signers.length);
  if (signers.length > 0) {
    const [signer] = signers;
    console.log("Using signer address:", await signer.getAddress());

    // Get the Goalz contract instance with signer
    const Goalz = await hre.ethers.getContractAt("Goalz", GOALZ, signer);

    // Set up withdraw parameters
    const goalId = 0; // Assuming the first goal has ID 0

    console.log("Withdrawing from goal with the following parameters:");
    console.log("Goal ID:", goalId);

    // Call withdraw function
    const tx = await Goalz.withdraw(goalId, { gasLimit: 1000000 });
    console.log("Withdraw transaction sent. Waiting for confirmation...");

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Withdraw successful!");
    console.log("Transaction hash:", receipt.hash);

    const withdrawMadeEvent = receipt.logs
      .map((log) => {
        try {
          return Goalz.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((parsedLog) => parsedLog && parsedLog.name === "WithdrawMade");

    if (withdrawMadeEvent) {
      const [saver, goalId, amount] = withdrawMadeEvent.args;
      console.log("Withdraw details:");
      console.log("Saver:", saver);
      console.log("Goal ID:", goalId.toString());
      console.log("Amount withdrawn:", hre.ethers.formatUnits(amount, 6), "USDC");
    } else {
      console.log("WithdrawMade event not found in the transaction logs");
    }
  } else {
    console.error("No signers available. Check your Hardhat configuration and environment variables.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
