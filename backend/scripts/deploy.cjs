const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying PDCA contract...");

    const PDCA = await hre.ethers.getContractFactory("PDCA"); // Ensure "PDCA" matches the contract name in PDCA.sol
    const pdca = await PDCA.deploy(); // Deploy the contract
    await pdca.waitForDeployment(); // Fix: Use waitForDeployment instead of deployed

    console.log(`✅ PDCA deployed to: ${await pdca.getAddress()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
