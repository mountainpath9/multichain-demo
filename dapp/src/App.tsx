import { useState, useEffect, createElement } from 'react'
import { ethers } from 'ethers';

import { PROVIDER_URLS, CONFIG } from "./configs/local";
import { Api, createApi } from "./api";
import { FlowUi } from "./flow/ui";

import './App.css'

function App() {

  const [api, setApi] = useState<Api| null>(null);

  async function metamaskConnect() {
    if (typeof window !== undefined) {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner();
      await provider.send("eth_requestAccounts", []);
      const api = createApi(PROVIDER_URLS, signer, CONFIG.tokenStoreAddress);

      let address = await signer.getAddress();
      console.log("address", address);
      let tm =  await api.getTokenMetadata(CONFIG.daiMainnet);
      console.log(
       "mainnet dai",
        tm,
        await api.getTokenBalance(tm, address),
        await api.getTokenSupply(tm),
      );

      tm =  await api.getTokenMetadata(CONFIG.daiArbitrum);
      console.log(
        "arbitrum dai",
        tm,
        await api.getTokenBalance(tm, address),
        await api.getTokenSupply(tm,)
      );

      tm = await api.getTokenMetadata(CONFIG.daiGnosis); 
      console.log(
        "gnosis dai",
        tm,
        await api.getTokenBalance(tm, address),
        await api.getTokenSupply(tm,)
      );
      setApi(api)
    }

  }

  function renderConnect() {
    return <p>
      <button type="button" onClick={metamaskConnect}>
        Connect to Metamask
      </button>
    </p>;
  }

  return (
    <div className="App">
      <h1>TokenStore</h1>
      {api == null ? renderConnect() : <FlowUi api={api}/>}
    </div>
  )
}

export default App
