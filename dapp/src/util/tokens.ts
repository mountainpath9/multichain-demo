import { Signer } from "ethers";
import {IERC20Metadata__factory} from "types/typechain/factories/IERC20Metadata__factory";
import {IERC20__factory} from "types/typechain/factories/IERC20__factory";
import {IERC20} from "types/typechain/IERC20";

export interface TokenMetadata {
    address: string,
    symbol: string,
    name: string,
    decimals: number,
};

export async function getTokenMetadata(address: string, signer: Signer): Promise<TokenMetadata> {
    const token = await IERC20Metadata__factory.connect(address, signer);
    const symbol = await token.symbol();
    const name = await token.name();
    const decimals = await token.decimals();

    return {address, symbol, name, decimals};
}

export async function connectToken(address: string, signer: Signer): Promise<IERC20> {
  return IERC20__factory.connect(address, signer);
}