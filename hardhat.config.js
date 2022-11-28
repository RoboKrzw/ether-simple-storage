require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config()
require("hardhat-deploy")

GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
PRIVATE_KEY = process.env.PRIVATE_KEY
//TE DWA PONIŻSZE bierzemy z ich www
COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: "0.8.8",
  solidity: {
    compilers: [{
      version: "0.8.8",
      },
      {
        version: "0.6.6"
      }
    ]
  },
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 2,
      allowUnlimitedContractSize: true
    },
    hardhat: {
      chainId: 31337,
      // gasPrice: 130000000000,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    // coinmarketcap: COINMARKETCAP_API_KEY,
    token: "MATIC"
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: []
  },
  namedAccounts: {
    deployer: {
        default: 0, // here this will by default take the first account as deployer
    },
  }
};
