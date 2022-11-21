import { ChainId } from "api";
import { ethers } from "ethers";

export interface MetamaskConnection {
  signer: ethers.Signer,
  chainId: ChainId,
  address: string,
}
