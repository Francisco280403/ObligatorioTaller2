require("dotenv").config();
require("solidity-coverage");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" }
    ]
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [
        "5fbca4763f740dab1385eaa0d33212ae32ff29401d1f4a15efb132d4a8b9d384"
      ]
    }
  },
  etherscan: {
    apiKey: {
      polygonAmoy: "VWUQ1H4EIR9GGGZ687ASKDWZI9W5IF97H9"
    }
  },
  paths: {
    sources: "./contracts",
    tests:   "./test"
  },
  mocha: { timeout: 20000 }
};
