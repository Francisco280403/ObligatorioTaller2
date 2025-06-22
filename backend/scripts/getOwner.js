// Script para consultar el owner actual del contrato DaoGovernance
const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

const DAO_ADDRESS = process.env.DAO_CONTRACT_ADDRESS;
const ABI_PATH = "./artifacts/contracts/DaoGovernance.sol/DaoGovernance.json";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

async function main() {
  const abi = JSON.parse(fs.readFileSync(ABI_PATH)).abi;
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(DAO_ADDRESS, abi, provider);
  const owner = await contract.owner();
  console.log("Owner actual del contrato:", owner);
}

main().catch(console.error);
