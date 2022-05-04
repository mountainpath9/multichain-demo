import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DemoToken, DemoToken__factory } from '../../typechain';
import { TokenStore, TokenStore__factory } from '../../typechain';

export interface Contracts {
    token1: DemoToken,
    token2: DemoToken,
    tokenStore: TokenStore,
};

export interface ContractAddresses {
  token1: string,
  token2: string,
  tokenStore: string,
};

export async function deploy(owner: SignerWithAddress): Promise<Contracts> {
  
  const token1 = await new DemoToken__factory(owner).deploy("Demo Token 1", "DTK1");
  const token2 = await new DemoToken__factory(owner).deploy("Demo Token 2", "DTK2");
  const tokenStore = await new TokenStore__factory(owner).deploy();

  await token1.deployed();
  await token2.deployed();
  await tokenStore.deployed();

  const config: Contracts = {
    token1,
    token2,
    tokenStore,
  };

  return config;
}

export function contractAddresses(contracts: Contracts): ContractAddresses {
  return {
    token1: contracts.token1.address,
    token2: contracts.token2.address,
    tokenStore: contracts.tokenStore.address,
  }
}

  