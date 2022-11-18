import { useState, useEffect, createElement } from 'react'
import { BigNumber, ethers } from 'ethers';

import { CHAINS, TOKENS } from "./configs/local";
import { Api, ChainConfig, createApi, TokenMetadata } from "./api";

import './App.css'


function App() {

  const [api, setApi] = useState<Api| undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [nativeBalances, setNativeBalances] = useState<NativeBalance[] | undefined>();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[] | undefined>();

  useEffect(() => {
    setApi(createApi(CHAINS));
  }, [CHAINS]);

  useEffect(() => {
    async function load() {
      if (api && address) {
       const balances = await loadNativeBalances(api,address);
       setNativeBalances(balances);
      } else {
        setNativeBalances(undefined);
      }
    }
    load();
  }, [api, address])

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

  let connect = address == undefined && renderConnect();
  let table1 = nativeBalances && renderNativeBalances(nativeBalances);
  let table2 = tokenBalances && renderTokenBalances(tokenBalances);

  return (
    <div className="App">
      <h1>Multichain Balances</h1>
      {connect}
      <div>{table1 || <p>Loading native balances...</p>}</div>
      <div>{table2 || <p>Loading token balances...</p>}</div>
    </div>
  );
}

function renderNativeBalances(balances: NativeBalance[]): JSX.Element {
  const rows = balances.map( b => {
    const balance = ethers.utils.formatUnits(b.balance, b.chain.nativeCurrencyDecimals);
    return (
      <tr key={b.chain.chainId}>
        <td>{b.chain.name}</td>
        <td>{b.chain.chainId}</td>
        <td>{b.chain.nativeCurrency}</td>
        <td>{balance}</td>
      </tr>
    )
  });

  return (
    <table className="App-BalanceTable">
      <thead>
        <tr>
          <th>Network</th>
          <th>Chain Id</th>
          <th>Native Currency</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  )
}


function renderTokenBalances(balances: TokenBalance[]): JSX.Element {
  const rows = balances.map( b => {
    const chainId = b.metadata.config.chainId;
    const address = b.metadata.config.address;
    const balance = ethers.utils.formatUnits(b.balance, b.metadata.decimals);
    return (
      <tr key={address + chainId}>
        <td>{chainId}</td>
        <td>{b.metadata.symbol}</td>
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
          <th>ERC-20 Token</th>
          <th>Address</th>
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

interface NativeBalance {
  chain: ChainConfig,
  balance: BigNumber,
}

interface TokenBalance {
  metadata: TokenMetadata,
  balance: BigNumber,
}

async function loadTokenBalances(api: Api, accountAddress: string): Promise<TokenBalance[]> {
  return Promise.all(
    TOKENS.map(async t => {
      const metadata = await api.getTokenMetadata(t);
      const balance = await api.getTokenBalance(metadata, accountAddress);
      return {metadata,balance};
    })
  )
}

async function loadNativeBalances(api: Api, accountAddress: string): Promise<NativeBalance[]> {
  return Promise.all(
    api.chains.values().map(async chain => {
      const balance = await api.getNativeBalance(chain.chainId, accountAddress);
      return {chain,balance};
    })
  );
}

export default App
