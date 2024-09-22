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

  // Set up goal parameters
  const what = "Vacation Fund";
  const why = "Dream vacation to Hawaii";
  const targetAmount = hre.ethers.parseUnits("1000", 6); // Assuming USDC has 6 decimals
  const targetDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

  console.log("Setting goal with the following parameters:");
  console.log("What:", what);
  console.log("Why:", why);
  console.log(
    "Target Amount:",
    hre.ethers.formatUnits(targetAmount, 6),
    "USDC"
  );
  console.log("Target Date:", new Date(targetDate * 1000).toLocaleString());

  // Call setGoal function
  const tx = await Goalz.setGoal(what, why, targetAmount, targetDate, USDC);
  console.log("Transaction sent. Waiting for confirmation...");

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Goal set successfully!");
  console.log("Transaction hash:", receipt.hash);

  const goalCreatedEvent = receipt.logs
    .map((log) => {
      try {
        return Goalz.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .find((parsedLog) => parsedLog && parsedLog.name === "GoalCreated");

  if (goalCreatedEvent) {
    const [saver, goalId] = goalCreatedEvent.args;
    console.log("Goal ID:", goalId.toString());
    console.log("Saver:", saver);
  } else {
    console.log("GoalCreated event not found in the transaction logs");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
