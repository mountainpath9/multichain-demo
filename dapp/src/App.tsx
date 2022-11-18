import { useState, useEffect, createElement } from 'react'
import { BigNumber, ethers } from 'ethers';

import { CHAINS, TOKENS } from "./configs/local";
import { Api, createApi, TokenMetadata } from "./api";

import './App.css'


function App() {

  const [api, setApi] = useState<Api| undefined>();
  const [address, setAddress] = useState<string | undefined>()
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[] | undefined>();

  useEffect(() => {
    setApi(createApi(CHAINS));
  }, [CHAINS]);

  useEffect(() => {
    async function load() {
      if (api && address) {
       const balances = await loadTokenBalances(api,address);
       setTokenBalances(balances);
      } else {
        setTokenBalances(undefined);
      }
    }
    load();
  }, [api, address])


  async function metamaskConnect() {
    if (typeof window !== undefined) {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner();
      await provider.send("eth_requestAccounts", []);
      let address = await signer.getAddress();
      setAddress(address);
    }
  }

  function renderConnect() {
    return <p>
      <button type="button" onClick={metamaskConnect}>
        Connect to Metamask
      </button>
    </p>;
  }

  let content = undefined;

  if (address === undefined) {
    content = renderConnect();
  } else if (tokenBalances == undefined) {
    content = <div>loading...</div>
  } else {
    content = renderTokenBalances(tokenBalances);;
  }

  return (
    <div className="App">
      <h1>Multichain Balances</h1>
      {address && <p>Balances for {address}</p>}
      {content}
    </div>
  );
}

function renderTokenBalances(balances: TokenBalance[]): JSX.Element {
  const rows = balances.map( b => {
    const chainId = b.metadata.config.chainId;
    const address = b.metadata.config.address;
    const balance = ethers.utils.formatUnits(b.balance, b.metadata.decimals);
    return (
      <tr key={address + chainId}>
        <td>{chainId}</td>
        <td>{address}</td>
        <td>{balance}</td>
        <td></td>
      </tr>
    )
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Network</th>
          <th>Contract</th>
          <th>Balance</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  )
}

interface TokenBalance {
  metadata: TokenMetadata,
  balance: BigNumber,
}

async function loadTokenBalances(api: Api, accountAddress: string): Promise<TokenBalance[]> {
  const result: TokenBalance[] = [];
  for(const t of TOKENS) {
    const metadata = await api.getTokenMetadata(t);
    const balance = await api.getTokenBalance(metadata, accountAddress);
    result.push({metadata,balance});
  }
  return result;
}

export default App
