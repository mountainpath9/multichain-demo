import { Signer, BigNumber } from "ethers";

import {TokenStore} from "types/typechain/TokenStore";
import {TokenStore__factory} from "types/typechain/factories/TokenStore__factory";
import {IERC20Metadata__factory} from "types/typechain/factories/IERC20Metadata__factory";
import {IERC20__factory} from "types/typechain/factories/IERC20__factory";

// API capturing all on chain interactions
//
export interface Api {
  // Get the metadata for any ERC20 token
  getTokenMetadata (address: string): Promise<TokenMetadata>;

  // Allow the token store to transfer amount of the specified token
  storeApprove(token: TokenMetadata, amount: BigNumber): Promise<TxResult<void>>;

  // Deposit the specified amount of the token into the store
  // (requires approval)
  storeDeposit(token: TokenMetadata, amount: BigNumber): Promise<void>;

  // Withdraw the specified amount of the token from the store
  storeWithdraw(token: TokenMetadata, amount: BigNumber): Promise<void>;

  // Fetch the current balances in the store
  getStoreBalances(): Promise<StoreTokenBalance[]>;
};

export function createApi(signer: Signer, tokenStoreAddr: string): Api {
  return new ApiImpl(signer, tokenStoreAddr);
}

export interface TokenMetadata {
  address: string,
  symbol: string,
  name: string,
  decimals: number,
};

export interface StoreTokenBalance {
  token: TokenMetadata,
  balance: BigNumber,
};

export type TxResult<T> 
  = { kind: 'success', result: T}
  | { kind: 'tx-rejected' }
  ;

class ApiImpl implements Api {

  readonly tokenStore: TokenStore;

  constructor(readonly signer: Signer, tokenStoreAddr: string) {
    this.tokenStore = TokenStore__factory.connect(tokenStoreAddr, signer);
  }

  async getTokenMetadata(address: string): Promise<TokenMetadata> {
      const token = await IERC20Metadata__factory.connect(address, this.signer);
      const symbol = await token.symbol();
      const name = await token.name();
      const decimals = await token.decimals();
      return {address, symbol, name, decimals};
  }

  async storeApprove(tokenMetadata: TokenMetadata, amount: BigNumber): Promise<TxResult<void>> {
      const token = IERC20__factory.connect(tokenMetadata.address, this.signer);
      return catchTxErrors(async () => {
        const tx = await token.approve(this.tokenStore.address, amount);
        await tx.wait();
      });
  }

  async storeDeposit(tokenMetadata: TokenMetadata, amount: BigNumber): Promise<void> {
    const tx = await this.tokenStore.deposit(tokenMetadata.address, amount);
    await tx.wait();
  }

  async storeWithdraw(tokenMetadata: TokenMetadata, amount: BigNumber): Promise<void> {
    const tx = await this.tokenStore.withdraw(tokenMetadata.address, amount);
    await tx.wait();
  }

  async getStoreBalances(): Promise<StoreTokenBalance[]> {
    const result: StoreTokenBalance[] = [];
    for(let b of await this.tokenStore.getBalances()) {
      const token = await this.getTokenMetadata(b.erc20Token);
      result.push({
        token,
        balance: b.balance,
      });
    }
    return result;
  }
}

async  function catchTxErrors<T>(fn: () => Promise<T> ): Promise<TxResult<T>> {
  try {
    const result = await fn();
    return {kind:'success', result};
  } catch (e) {
    if ((e as any).code === 4001) {
      return {kind:'tx-rejected'};
    }
    throw e;
  }
}
