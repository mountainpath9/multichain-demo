import '@nomiclabs/hardhat-ethers';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'hardhat';
import { deploy, contractAddresses } from "./deployment";
import { toAtto } from "../../shared/utils";

async function main() {
  const [owner, user] = await ethers.getSigners();

  const contracts = await deploy(owner);

  console.log("Contract addresses", JSON.stringify(contractAddresses(contracts), null, 2) );
  
  // Mint some tokens for testing
  await contracts.token1.mint(user.address, toAtto(1000));
  await contracts.token2.mint(user.address, toAtto(2000));
  console.log("Token balances for", user.address);
  console.log("   ", await contracts.token1.symbol(), await contracts.token1.balanceOf(user.address));
  console.log("   ", await contracts.token2.symbol(), await contracts.token2.balanceOf(user.address));

  // Write local config for the dapp
  const localConfigPath = path.join(__dirname, '../../dapp/src/configs/local.ts');
  const deployTs = `
export const CONFIG = {
  tokenStoreAddress: "${contracts.tokenStore.address}",
}
`
  await fs.promises.writeFile(localConfigPath, deployTs);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
