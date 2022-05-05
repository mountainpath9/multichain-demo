import { useState, useEffect } from 'react'
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

import { useTypedFieldState, TypedFieldState } from './util/fields/hooks';
import { ETH_ADDRESS_FIELD, tokenAmountField } from './util/fields/ethers';
import { CONFIG } from "./configs/local";
import { Api, TokenMetadata, createApi } from "./api";

import './App.css'
import { monitorEventLoopDelay } from 'perf_hooks';


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
      {api == null ? renderConnect() : <AppUi api={api}/>}
    </div>
  )
}

interface StoreTokenBalance {
  token: TokenMetadata,
  balance: BigNumber,
};

type ModalState = ModalDepositNew | ModalDeposit | ModalWithdrawal ;

interface ModalDepositNew {
  kind: "deposit-new",
};

interface ModalDeposit {
  kind: "deposit",
  token: TokenMetadata,
}

interface ModalWithdrawal {
  kind: "withdrawal",
  token: TokenMetadata,
  balance: BigNumber,
}

function AppUi(props: {api: Api}) {

  const [storeBalances, setStoreBalances] = useState<StoreTokenBalance[]| null>(null);
  const [modal, setModal] = useState<ModalState| null>(null);

  async function loadBalances() {
    const balances = await props.api.getStoreBalances();
    setStoreBalances(balances);
  };

  useEffect(() => {
    loadBalances()
  }, []);

  function showDepositNew() {
    setModal({kind:"deposit-new",});
  }

  function showDeposit(token: TokenMetadata) {
    setModal({kind:"deposit", token});
  }

  function showWithdrawal(from: StoreTokenBalance) {
    setModal({kind:"withdrawal",...from});
  }

  function closeModal() {
    loadBalances();
    setModal(null);
  }

  function renderContent() {
    if (storeBalances == null) {
      return <p>Loading...</p>;
    };

    if (modal == null) {
      return (
        <div>
          {renderBalanceTable(
            storeBalances, 
            showDeposit, 
            showWithdrawal,
            )}
            <div>
              <button onClick={showDepositNew}>Deposit new token...</button>
            </div>
        </div>
      );   
    } else if (modal.kind == "deposit-new") {
      return <DepositNewModal
        api={props.api}
        onContinue={showDeposit}
        onClose={closeModal}
      />;
    } else if (modal.kind == "deposit") {
      return <DepositModal 
        api={props.api} 
        token={modal.token} 
        onClose={closeModal}
      />;
    } else {
      return <WithdrawalModal 
        api={props.api}
        token={modal.token}
        balance={modal.balance}
        onClose={closeModal}
      />;
    }
  }

  return (
    <div>
      {renderContent()}
    </div>
  );

}

function renderBalanceTable(
  balances: StoreTokenBalance[],
  showDeposit: (from:TokenMetadata) => void,
  showWithdrawal: (from:StoreTokenBalance) => void,
  ) {
  
  function renderBalance(balance: StoreTokenBalance) {
    return (
      <tr>
        <td>{`${balance.token.symbol} (${balance.token.address})`}</td>
        <td>{formatUnits(balance.balance, balance.token.decimals)}</td>
        <td><button onClick={() => showDeposit(balance.token)}>Deposit...</button></td>
        <td><button onClick={() => showWithdrawal(balance)}>Withdraw...</button></td>
      </tr>
    )
  }

  if (balances.length === 0) {
    return <p>No tokens stored</p>;
  };

  return (
    <table className="App-BalanceTable">
      <thead>
        <tr>
          <th>Token</th>
          <th>Balance</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {balances.map(renderBalance)}
      </tbody>
    </table>
  );
}

function DepositNewModal(props: {
  api: Api,
  onContinue: (token: TokenMetadata) => void;
  onClose: () => void,
}) {

  const tokenField = useTypedFieldState(ETH_ADDRESS_FIELD);
  const [inProgress, setInProgress] = useState(false);

  const formValid = tokenField.isValid();

  async function go() {
    setInProgress(true);
    const token = await props.api.getTokenMetadata(tokenField.value());
    props.onContinue(token);
    setInProgress(false);
  }

  return (
    <div>
      {`Choose token asset`}
      <div className="Form">
        {renderField("Token Address", tokenField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={props.onClose} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function DepositModal(props: {
  api: Api,
  token: TokenMetadata,
  onClose: () => void,
}) {

  const amountField = useTypedFieldState(tokenAmountField(props.token.decimals));
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid();

  async function go() {
    setInProgress(true);

    const amount = amountField.value();

    // add allowance
    await props.api.storeApprove(props.token, amount);

    // Deposit tokens to the store
    await props.api.storeDeposit(props.token, amount);

    setInProgress(false);
    props.onClose();
  }

  return (
    <div>
      {`Depositing ${props.token.symbol} from wallet into store`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={props.onClose} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function WithdrawalModal(props: {
  api: Api,
  token: TokenMetadata,
  balance: BigNumber,
  onClose: () => void,
}) {


  const amountFieldType = tokenAmountField(props.token.decimals);
  const amountField = useTypedFieldState(amountFieldType);
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid();

  async function go() {
    setInProgress(true);
    const amount = amountField.value();
    await props.api.storeWithdraw(props.token, amount);
    setInProgress(false);
    props.onClose();
  }

  return (
    <div>
      {`Withdrawing ${props.token.symbol} from store, available balance is ${amountFieldType.toText(props.balance)}`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={props.onClose} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function renderField<T>(label: String, field: TypedFieldState<T>, disabled: boolean) {
  return (
    <div className="Field">
      <div>{label}:</div>
      <input value={field.text} onChange={e => field.setText(e.target.value)}  disabled={disabled}/>
      {field.isValid() ? null : <div className="Field-Error"> ← {field.validationError()}</div>}
    </div>
  );
}

export default App
