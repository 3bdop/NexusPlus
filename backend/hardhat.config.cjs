require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    solidity: "0.8.28",  // Keep it the same as your contract
    networks: {
        hardhat: {},
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    }
};
