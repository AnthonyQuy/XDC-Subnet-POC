require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Default values if not defined in .env file
const SUBNET_URL = process.env.SUBNET_URL || "http://192.168.25.11:8545";
const PARENTNET_URL = process.env.PARENTNET_URL || "https://erpc.apothem.network/";
const SUBNET_PK = process.env.SUBNET_PK || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const GAS_PRICE = process.env.GAS_PRICE || 10000000000; // 10 Gwei
const GAS_LIMIT = process.env.GAS_LIMIT || 4700000;
const NETWORK_ID = process.env.NETWORK_ID || 551;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    subnet: {
      url: SUBNET_URL,
      accounts: [SUBNET_PK],
      chainId: parseInt(NETWORK_ID),
      gasPrice: parseInt(GAS_PRICE),
      gas: parseInt(GAS_LIMIT)
    },
    parentnet: {
      url: PARENTNET_URL,
      accounts: [SUBNET_PK],
      gasPrice: "auto"
    }
  },
  paths: {
    sources: "./source",
    cache: "./cache",
    artifacts: "./compiled"
  },
  mocha: {
    timeout: 20000
  }
};
