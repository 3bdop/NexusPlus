// backend/utils/pdcaContract.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load ABI
const artifactPath = path.resolve(__dirname, "../artifacts/contracts/PDCA.sol/PDCA.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

// ✅ Set contract address (copied from Hardhat deploy output)
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // change if needed

// ✅ Setup local Hardhat provider
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// ✅ Load wallet using private key
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Create contract instance
const pdca = new ethers.Contract(contractAddress, abi, wallet);

// ✅ Export issueCertificate function
export async function issueCertificate(did, validityPeriodInSeconds = 86400 * 365) {
    try {
        const tx = await pdca.issueCertificate(did, validityPeriodInSeconds);
        await tx.wait();
        console.log("✅ Certificate issued for:", did);
        return true;
    } catch (err) {
        console.error("Smart contract error:", err);
        return false;
    }
}
