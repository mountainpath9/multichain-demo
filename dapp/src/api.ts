import { providers, Signer, BigNumber } from "ethers";
import * as ethers from "ethers";

import {IERC20Metadata__factory} from "types/typechain/factories/IERC20Metadata__factory";
import {IERC20__factory} from "types/typechain/factories/IERC20__factory";

// API capturing all on chain interactions
//
export interface Api {
  // Get the metadata for any ERC20 token
  getTokenMetadata (tokenConfig: TokenConfig): Promise<TokenMetadata>;

  // Get the token supply
  getTokenSupply(token: TokenMetadata): Promise<BigNumber>;

  // The the balance of a token account
  getTokenBalance(token: TokenMetadata, address: string): Promise<BigNumber>;
};

type ProviderUrls = {[chainId:string] : string};

interface ChainConfig {
  name: string,
  chainId: number,
  rpcUrl: string,
}

interface TokenConfig {
  address: string,
  chainId: number,
}

export function createApi(chains: ChainConfig[]): Api {
  return new ApiImpl(chains);
}

export interface TokenMetadata {
  config: TokenConfig,
  symbol: string,
  name: string,
  decimals: number,
};

export interface StoreTokenBalance {
  token: TokenMetadata,
  balance: BigNumber,
};

export type TxPromise<T> = Promise<TxResult<T>>;

export type TxResult<T> 
  = { kind: 'success', result: T}
  | TxError
  ;

export type TxError 
  = { kind: 'tx-rejected' }
  ;

class ApiImpl implements Api {

  providers: {[chainId: string]: providers.BaseProvider} = {};

  constructor(readonly chains: ChainConfig[]) {
  }

  getProvider(chainId: number): providers.BaseProvider {
    const chainIdKey = chainId.toString();
    let provider = this.providers[chainIdKey];
    if (provider === undefined) {
      const chain = this.chains.find(c => c.chainId === chainId);
      if (chain === undefined) {
        throw new Error("No chain configured for chain id " + chainId);
      }
      console.log("new provider for chain " + chainId + " via " + chain.rpcUrl);
      provider = ethers.getDefaultProvider(chain.rpcUrl);
      this.providers[chainIdKey] = provider;
    }
    return provider;
  }

  async getTokenMetadata(config: TokenConfig): Promise<TokenMetadata> {
    const provider = await this.getProvider(config.chainId);
    const token = await IERC20Metadata__factory.connect(config.address, provider);
    const symbol = await token.symbol();
    const name = await token.name();
    const decimals = await token.decimals();
    return {config, symbol, name, decimals};
  }

  async getTokenSupply(tokenMetadata: TokenMetadata): Promise<BigNumber> {
    const provider = await this.getProvider(tokenMetadata.config.chainId);
    const token = await IERC20Metadata__factory.connect(tokenMetadata.config.address, provider);
    return await token.totalSupply();
  }

  async getTokenBalance(tokenMetadata: TokenMetadata, address: string): Promise<BigNumber> {
    const provider = await this.getProvider(tokenMetadata.config.chainId);
    const token = await IERC20Metadata__factory.connect(tokenMetadata.config.address, provider);
    return await token.balanceOf(address);
  }
}

async  function catchTxErrors<T>(fn: () => Promise<T> ): Promise<TxResult<T>> {
  try {
    const result = await fn();
    return {kind:'success', result};
  } catch (e) {
    if ((e as any).code === 4001) {
      // Metamask rejected the request
      return {kind:'tx-rejected'};
    }
    throw e;
  }
}
