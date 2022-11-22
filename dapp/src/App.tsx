import { useState, useEffect, createElement } from 'react'
import { BigNumber, ethers } from 'ethers';

import { CHAINS, TOKENS } from "./configs/local";
import { ProviderApi, ChainConfig, createProviderApi, TokenMetadata, ChainId } from "./api";

import './App.css'
import { MetamaskConnection } from 'types';
import { SendFlowState, stateShowForm } from "./flows/send/state";
import { SendFlowUi} from "./flows/send/ui";
import { ApiManagerProvider, useApiManager } from './use-api-manager';

function App() {
  return (
    <ApiManagerProvider chains={CHAINS}>
      <AppContent/>
    </ApiManagerProvider>
  );
}


function AppContent() {

  const [nativeBalances, setNativeBalances] = useState<NativeBalance[] | undefined>();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[] | undefined>();
  const [sendState, setSendState] = useState<SendFlowState| undefined>();

  const apiManager = useApiManager();
  const api = apiManager.api;
  const metamask = apiManager.metamask;

  // useEffect(() => {
  //   apiManager.connectMetamask();
  // }, []);

  useEffect(() => {
    async function load() {
      if (api && metamask) {
       const balances = await loadNativeBalances(api,metamask.address);
       setNativeBalances(balances);
      } else {
        setNativeBalances(undefined);
      }
    }
    load();
  }, [api, metamask])

  useEffect(() => {
    async function load() {
      if (api && metamask) {
       const balances = await loadTokenBalances(api,metamask.address);
       setTokenBalances(balances);
      } else {
        setTokenBalances(undefined);
      }
    }
    load();
  }, [api, metamask])

  function renderConnect() {
    return <p>
      <button type="button" onClick={() => apiManager.connectMetamask()}>
        Connect to Metamask
      </button>
    </p>;
  }

  async function onSendToken(tmeta: TokenMetadata) {
    await apiManager.connectMetamask(tmeta.config.chainId);
    setSendState(stateShowForm(tmeta))
  }

  let flow = sendState && metamask && (
    <SendFlowUi
      state={sendState}
      setState={setSendState}
      onDone={() => setSendState(undefined)}
    />
  );

  let connection = metamask ? renderMetamaskConnection(metamask) : renderConnect();
  let chainId = metamask?.chainId || 0;

  let table1 = nativeBalances && renderNativeBalances(nativeBalances);
  let table2 = tokenBalances && renderTokenBalances(chainId, tokenBalances, sendState ? undefined : onSendToken);

  return (
    <div className="App">
      <h1>Multichain Balances</h1>
      {connection}
      <div>{table1 || <p>Loading native balances...</p>}</div>
      <div>{table2 || <p>Loading token balances...</p>}</div>
      <div className="Form">
        {flow}
      </div>
    </div>
  );
}


interface NativeBalance {
  chain: ChainConfig,
  balance: BigNumber,
}

interface TokenBalance {
  metadata: TokenMetadata,
  balance: BigNumber,
}

function renderMetamaskConnection(mmConnection: MetamaskConnection): JSX.Element {
  return <p>Connected to: {mmConnection.address} on chain {mmConnection.chainId}</p>;
}

function renderNativeBalances(balances: NativeBalance[]): JSX.Element {
  const rows = balances.map( b => {
    const balance = ethers.utils.formatUnits(b.balance, b.chain.nativeCurrency.decimals);
    return (
      <tr key={b.chain.chainId}>
        <td>{b.chain.name}</td>
        <td>{b.chain.chainId}</td>
        <td>{b.chain.nativeCurrency.symbol}</td>
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


function renderTokenBalances(
  mmChainId: ChainId,
  balances: TokenBalance[],
  onSend: ((tm: TokenMetadata) => void) | undefined
  ): JSX.Element {
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
        <td><button className={mmChainId === b.metadata.config.chainId ? "ActionButton" : "CancelButton"} disabled={!onSend} onClick={() => {
          onSend && onSend(b.metadata)}
        }
        >Send</button></td>
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

async function loadTokenBalances(api: ProviderApi, accountAddress: string): Promise<TokenBalance[]> {
  return Promise.all(
    TOKENS.map(async t => {
      const metadata = await api.getTokenMetadata(t);
      const balance = await api.getTokenBalance(metadata, accountAddress);
      return {metadata,balance};
    })
  )
}

async function loadNativeBalances(api: ProviderApi, accountAddress: string): Promise<NativeBalance[]> {
  return Promise.all(
    api.chains.values().map(async chain => {
      const balance = await api.getNativeBalance(chain.chainId, accountAddress);
      return {chain,balance};
    })
  );
}

export default App
