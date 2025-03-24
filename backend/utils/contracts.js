import { ethers } from "ethers";
import contractABI from "../artifacts/contracts/PDCA.sol/PDCA.json" assert { type: "json" };

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // replace with your deployed address

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const signer = provider.getSigner(0); // This is the first account from Hardhat

const pdcaContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractABI.abi,
  signer
);

export default pdcaContract;
