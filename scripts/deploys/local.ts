import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { DemoToken__factory } from '../../typechain';
import { DeployedContracts } from './contract-addresses';

import { toAtto } from '../../shared/utils';

const EPOCH_SIZE_SECONDS = 60; // Every minute for local testing
const EPOCH_REWARD = toAtto(6849315 / 24);   // Daily rewards per hour 

async function main() {
  const [owner, account1, account2] = await ethers.getSigners();

  const token = await new DemoToken__factory(owner).deploy();
  
  // Print config
  const deployedContracts: DeployedContracts = {
    DEMO_TOKEN:  token.address,
    OWNER: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', // Account #19
  };

  const contractAddressAsMapping = deployedContracts as unknown as {[key: string]: string}
  
  console.log();
  console.log('=========================================');
  for (const envvar in contractAddressAsMapping) {
    console.log(`${envvar}=${contractAddressAsMapping[envvar]}`);
  }
  console.log('=========================================');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });