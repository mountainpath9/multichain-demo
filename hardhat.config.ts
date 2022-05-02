require('dotenv').config();

import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ganache'; // for testing
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';

// NOTE: Any tasks that depend on the generated typechain makes the build flaky.
//       Favour scripts instead

if (!process.env.ETHERSCAN_API_KEY) {
  console.log(
    "NOTE: environment variable ETHERSCAN_API_KEY isn't set. tasks that interact with etherscan won't work"
  );
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
//

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  typechain: {
    target: 'ethers-v5',
    outDir: './typechain',
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 120000,
  },
};
