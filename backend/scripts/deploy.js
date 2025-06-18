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
    deployer.address, // panic multisig
    ethers.utils.parseEther("1"), // token price
    10, // stakeToVote
    20, // stakeToPropose
    3600, // lockPeriod
    7200, // proposalDuration
    1, // voteUnit
    simple.address // initial strategy
  );
  await dao.deployed();

  console.log("DAO Contract:", dao.address);
  console.log("SimpleStrategy:", simple.address);
  console.log("FullQuorumStrategy:", fq.address);
  const tokenAddr = await dao.token();
  console.log("VotingToken:", tokenAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
