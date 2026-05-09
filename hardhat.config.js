require("@nomicfoundation/hardhat-toolbox")
require("@nomicfoundation/hardhat-ethers");
//require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    version: "0.8.9", // Specify the desired version of Solidity
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
  },
};
