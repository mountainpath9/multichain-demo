import { useState, useEffect, createElement } from 'react'
import { ethers } from 'ethers';

import { CONFIG } from "./configs/local";
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
      const api = createApi(signer, CONFIG.tokenStoreAddress);
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
