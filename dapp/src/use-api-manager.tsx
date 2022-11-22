import { ChainConfig, ChainId, createProviderApi, createSignerApi, ProviderApi, SignerApi } from "./api";
import { ethers, Signer } from "ethers";
import React, { useCallback, useMemo, useState } from "react";

interface ApiManager {
  api: ProviderApi;
  metamask: MetamaskConnection | undefined,

  connectMetamask(chainId?: ChainId): Promise<void>;
}

export interface MetamaskConnection {
  signer: Signer,
  signerApi: SignerApi,
  chainId: ChainId,
  address: string,
}

export const ApiManagerContext = React.createContext<ApiManager | undefined>(undefined);

export function ApiManagerProvider(props: {chains: ChainConfig[],  children?: React.ReactNode}) {
  const api = useMemo(() => createProviderApi(props.chains), [props.chains]);
  const [metamask, setMetamask] = useState<MetamaskConnection | undefined>();

  console.log("metamask", metamask);

  async function connectMetamask(mChainId?: ChainId) {
    if (typeof window !== undefined) {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      let chainId = await signer.getChainId();
      await provider.send("eth_requestAccounts", []);

      if (mChainId && mChainId !== chainId) {
        const toChain = api.chains.get(mChainId);
        if (!toChain) {
          throw new Error("No config for chainid " + mChainId);
        }
        await switchToChain(ethereum, toChain);
        chainId = toChain.chainId;
      }
      const address = await signer.getAddress();
      const signerApi = createSignerApi(chainId, signer);
      const newmm = {signer, signerApi, chainId, address};
      setMetamask((oldmm) => !oldmm || oldmm.chainId !== newmm.chainId ? newmm : oldmm);
    }
  }

  const apiManager: ApiManager = {
    api,
    metamask,
    connectMetamask,
  };
  return <ApiManagerContext.Provider value={apiManager}>{props.children}</ApiManagerContext.Provider>
}

export function useApiManager(): ApiManager {
  const chainSigner = React.useContext(ApiManagerContext);
  if (!chainSigner) {
    throw new Error('useChainSigner invalid outside an ChainSignerProvider');
  }
  return chainSigner;
}


async function switchToChain(ethereum: any, toChain: ChainConfig) {
  console.log(`switching to ${toChain.name} (id ${toChain.chainId})`);
  const chainIdStr = '0x' + toChain.chainId.toString(16);
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdStr}],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x' + toChain.chainId.toString(16),
              chainName: toChain.name,
              rpcUrls: [toChain.metamaskRpcUrl],
              nativeCurrency: toChain.nativeCurrency,
            },
          ],
        });
      } catch (addError) {
        // handle "add" error
      }
    } else {
      throw switchError;
    }
  }
}

