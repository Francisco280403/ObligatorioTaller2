const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  // Deploy voting strategies
  const Simple = await ethers.getContractFactory("SimpleMajorityStrategy");
  const simple = await Simple.deploy();
  await simple.deployed();

  const FullQuorum = await ethers.getContractFactory(
    "FullQuorumMajorityStrategy"
  );
  const fq = await FullQuorum.deploy();
  await fq.deployed();

  // Deploy DAO
  const Dao = await ethers.getContractFactory("DaoGovernance");
  const dao = await Dao.deploy(
    "VoteToken",
    "VOTE",
    ethers.utils.parseEther("0.01"), // token price: 0.01 ETH por token
    60 * 2, // lockPeriod: 2 minutos
    86400, // proposalDuration (24 horas)
    1, // voteUnit
    simple.address, // initial strategy
    deployer.address // owner
  );
  await dao.deployed();

  console.log("DAO Contract:", dao.address);
  console.log("SimpleStrategy:", simple.address);
  console.log("FullQuorumStrategy:", fq.address);
  const tokenAddr = await dao.token();
  console.log("VotingToken:", tokenAddr);

  // --- Actualización automática de .env frontend y backend ---
  const fs = require("fs");
  const path = require("path");

  // Variables para frontend
  const frontendEnv = [
    `REACT_APP_DAO_CONTRACT_ADDRESS=${dao.address}`,
    `REACT_APP_VOTING_TOKEN_ADDRESS=${tokenAddr}`,
    `REACT_APP_SIMPLE_STRATEGY_ADDRESS=${simple.address}`,
    `REACT_APP_FULLQUORUM_STRATEGY_ADDRESS=${fq.address}`,
    `REACT_APP_OWNER_ADDRESS=${deployer.address}`,
  ]
    .join("\n")
    .concat("\n");

  // Leer PRIVATE_KEY y RPC_URL actuales si existen
  let backendEnvExtra = "";
  const backendEnvPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, "utf8");
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("PRIVATE_KEY=") || line.startsWith("RPC_URL=")) {
        backendEnvExtra += line + "\n";
      }
    }
  }

  // Variables para backend
  const backendEnv = [
    `DAO_CONTRACT_ADDRESS=${dao.address}`,
    `VOTING_TOKEN_ADDRESS=${tokenAddr}`,
    `SIMPLE_STRATEGY_ADDRESS=${simple.address}`,
    `FULLQUORUM_STRATEGY_ADDRESS=${fq.address}`,
    `OWNER_ADDRESS=${deployer.address}`,
  ]
    .join("\n")
    .concat("\n")
    .concat(backendEnvExtra);

  // Rutas absolutas
  const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env");

  // Escribir archivos .env
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  fs.writeFileSync(backendEnvPath, backendEnv);

  // Copiar ABIs actualizados al frontend
  const daoAbiSrc = path.resolve(
    __dirname,
    "../artifacts/contracts/DaoGovernance.sol/DaoGovernance.json"
  );
  const tokenAbiSrc = path.resolve(
    __dirname,
    "../artifacts/contracts/VotingToken.sol/VotingToken.json"
  );
  const daoAbiDest = path.resolve(
    __dirname,
    "../../frontend/src/artifacts/DaoGovernance.json"
  );
  const tokenAbiDest = path.resolve(
    __dirname,
    "../../frontend/src/artifacts/VotingToken.json"
  );
  fs.copyFileSync(daoAbiSrc, daoAbiDest);
  fs.copyFileSync(tokenAbiSrc, tokenAbiDest);

  console.log(
    "\nArchivos .env de frontend y backend actualizados automáticamente.\n"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
