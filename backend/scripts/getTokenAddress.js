const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const daoAddress = process.env.DAO_CONTRACT;
  if (!daoAddress) {
    console.error("Falta la variable DAO_CONTRACT en el .env");
    process.exit(1);
  }
  // Cargar ABI desde artifacts
  const daoAbiPath = path.join(__dirname, "../artifacts/contracts/DaoGovernance.sol/DaoGovernance.json");
  const daoAbi = JSON.parse(fs.readFileSync(daoAbiPath)).abi;
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");
  const Dao = new ethers.Contract(daoAddress, daoAbi, provider);
  const tokenAddress = await Dao.token();
  console.log("DAO Token Address:", tokenAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
