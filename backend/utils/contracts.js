import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url); // to use CommonJS-style require

const contractABI = require("../artifacts/contracts/PDCA.sol/PDCA.json");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Hardhat local address

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Optional: use a wallet private key instead of getSigner if needed
const signer = provider.getSigner(0); // default to first account

const pdcaContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractABI.abi,
  signer
);

export default pdcaContract;
