import { providers, Signer, BigNumber } from "ethers";
import * as ethers from "ethers";

import {TokenStore} from "types/typechain/TokenStore";
import {TokenStore__factory} from "types/typechain/factories/TokenStore__factory";
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

  // Allow the token store to transfer amount of the specified token
  storeApprove(token: TokenMetadata, amount: BigNumber): TxPromise<void>;

  // Deposit the specified amount of the token into the store
  // (requires approval)
  storeDeposit(token: TokenMetadata, amount: BigNumber): TxPromise<void>;

  // Withdraw the specified amount of the token from the store
  storeWithdraw(token: TokenMetadata, amount: BigNumber): TxPromise<void>;

  // Fetch the current balances in the store
  getStoreBalances(): Promise<StoreTokenBalance[]>;
};

type ProviderUrls = {[chainId:string] : string};

interface TokenConfig {
  address: string,
  chainId: number,
}

export function createApi(providerUrls: ProviderUrls, signer: Signer, tokenStoreAddr: string): Api {
  return new ApiImpl(providerUrls, signer, tokenStoreAddr);
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

  readonly tokenStore: TokenStore;
  providers: {[chainId: string]: providers.BaseProvider} = {};

  constructor(readonly providerUrls: ProviderUrls, readonly signer: Signer, tokenStoreAddr: string) {
    this.tokenStore = TokenStore__factory.connect(tokenStoreAddr, signer);
  }

  getProvider(chainId: number): providers.BaseProvider {
    const chainIdKey = chainId.toString();
    let provider = this.providers[chainIdKey];
    if (provider === undefined) {
      const url = this.providerUrls[chainIdKey];
      if (url === undefined) {
        throw new Error("No provider url configured for chain id " + chainIdKey);
      }
      console.log("new provider for chain " + chainId + " via " + url);
      provider = ethers.getDefaultProvider(url);
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

  async storeApprove(tokenMetadata: TokenMetadata, amount: BigNumber): TxPromise<void> {
      const token = IERC20__factory.connect(tokenMetadata.config.address, this.signer);
      return catchTxErrors(async () => {
        const tx = await token.approve(this.tokenStore.address, amount);
        await tx.wait();
      });
  }

  async storeDeposit(tokenMetadata: TokenMetadata, amount: BigNumber): TxPromise<void> {
    return catchTxErrors(async () => {
      const tx = await this.tokenStore.deposit(tokenMetadata.config.address, amount);
      await tx.wait();
    });
  }

  async storeWithdraw(tokenMetadata: TokenMetadata, amount: BigNumber): TxPromise<void> {
    return catchTxErrors(async () => {
      const tx = await this.tokenStore.withdraw(tokenMetadata.config.address, amount);
      await tx.wait();
    });
  }

  async getStoreBalances(): Promise<StoreTokenBalance[]> {
    const result: StoreTokenBalance[] = [];
    // for(let b of await this.tokenStore.getBalances()) {
    //   const token = await this.getTokenMetadata(b.erc20Token);
    //   result.push({
    //     token,
    //     balance: b.balance,
    //   });
    // }
    return result;
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
