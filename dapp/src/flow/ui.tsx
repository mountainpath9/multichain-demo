import { useState, useEffect } from 'react'
import { BigNumber } from 'ethers';

import { useTypedFieldState, TypedFieldState } from '../util/fields/hooks';
import { ETH_ADDRESS_FIELD, tokenAmountField } from '../util/fields/ethers';
import { Api, TokenMetadata, TxError } from "../api";

import * as flow from "./state";
import { formatUnits } from 'ethers/lib/utils';

export function FlowUi(props: {api: Api}) {
  const [state, setState] = useState<flow.State>(flow.stateHome);

  if (state.kind == "home") {
    return <HomeUI
      api={props.api}
      state={state}
      setState={setState}
    /> 
  } else if (state.kind == "deposit-new") {
    return <DepositNewUI
      api={props.api}
      state={state}
      setState={setState}
    />
  } else if (state.kind == "deposit") {
    return <DepositUI 
      api={props.api}
      state={state}
      setState={setState}
    />;
  } else if (state.kind == "withdrawal") {
    return <WithdrawalUI 
      api={props.api}
      state={state}
      setState={setState}
    />;
  } else {
    return <ErrorUI 
      state={state}
      setState={setState}
    />;
  }
}

interface StoreTokenBalance {
  token: TokenMetadata,
  balance: BigNumber,
};

  
function HomeUI(props: {
  api: Api,
  state: flow.StateHome,
  setState: (s: flow.State) => void,
}) {

  const [balances, setBalances] = useState<StoreTokenBalance[]| null>(null);

  async function loadBalances() {
    const balances = await props.api.getStoreBalances();
    setBalances(balances);
  };

  useEffect(() => {
    loadBalances()
  }, []);

  if (balances == null) {
    return <p>Loading...</p>;
  };

  function depositNew() {
    props.setState(props.state.depositNew());
  }

  function deposit(balance: StoreTokenBalance) {
    props.setState(props.state.deposit(balance.token));
  }

  function withdrawal(balance: StoreTokenBalance) {
    props.setState(props.state.withdrawal(balance.token, balance.balance));
  } 
  
  function renderBalance(balance: StoreTokenBalance) {
    return (
      <tr>
        <td>{`${balance.token.symbol} (${balance.token.address})`}</td>
        <td>{formatUnits(balance.balance, balance.token.decimals)}</td>
        <td><button onClick={() => deposit(balance)}>Deposit...</button></td>
        <td><button onClick={() => withdrawal(balance)}>Withdraw...</button></td>
      </tr>
    )
  }

  function renderTokenTable(balances: StoreTokenBalance[]) {
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
    )
  }



  return (
    <div>
      {renderTokenTable(balances)}
      <div>
        <button onClick={depositNew}>Deposit new token...</button>
      </div>
    </div>
  );
}

function DepositNewUI(props: {
  api: Api,
  state: flow.StateDepositNew,
  setState: (s: flow.State) => void,
}) {

  const tokenField = useTypedFieldState(ETH_ADDRESS_FIELD);
  const [inProgress, setInProgress] = useState(false);

  const formValid = tokenField.isValid();

  async function go() {
    setInProgress(true);
    const token = await props.api.getTokenMetadata(tokenField.value());
    props.setState(props.state.deposit(token));
    setInProgress(false);
  }

  function cancel() {
    props.setState(props.state.cancel());
  }

  return (
    <div>
      {`Choose token asset`}
      <div className="Form">
        {renderField("Token Address", tokenField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={cancel} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function DepositUI(props: {
  api: Api,
  state: flow.StateDeposit,
  setState: (s: flow.State) => void,
}) {
  const token = props.state.token;
  const amountField = useTypedFieldState(tokenAmountField(token.decimals));
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid();

  async function cancel() {
    props.setState(props.state.done());
  }

  async function go() {
    setInProgress(true);

    const amount = amountField.value();

    // add allowance
    {
      const r = await props.api.storeApprove(token, amount);
      if (r.kind != 'success') {
        props.setState(props.state.error(txErrorMessage(r)));
        return;
      }
    }

    // Deposit tokens to the store
    {
      const r = await props.api.storeDeposit(token, amount);
      if (r.kind != 'success') {
        props.setState(props.state.error(txErrorMessage(r)));
        return;
      }
    }

    setInProgress(false);
    props.setState(props.state.done());
  }

  return (
    <div>
      {`Depositing ${token.symbol} from wallet into store`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={cancel} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function WithdrawalUI(props: {
  api: Api,
  state: flow.StateWithdrawal,
  setState: (s: flow.State) => void,
}) {
  const token = props.state.token;
  const amountFieldType = tokenAmountField(token.decimals);
  const amountField = useTypedFieldState(amountFieldType);
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid() && amountField.value().lte(props.state.balance);

  async function cancel() {
    props.setState(props.state.done());
  }

  async function go() {
    setInProgress(true);
    const amount = amountField.value();
    const r = await props.api.storeWithdraw(token, amount);
    if (r.kind != 'success') {
      props.setState(props.state.error(txErrorMessage(r)));
      return;
    }
    setInProgress(false);
    props.setState(props.state.done());  
  }

  return (
    <div>
      {`Withdrawing ${token.symbol} from store, available balance is ${amountFieldType.toText(props.state.balance)}`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button onClick={go} disabled={!formValid || inProgress} >Go</button>
        <button onClick={cancel} disabled={inProgress}>Cancel</button>
      </div>
    </div>
  );
}

function txErrorMessage(error: TxError) {
  switch (error.kind) {
    case "tx-rejected": return "Transaction rejected in metamask";
  }
}

function ErrorUI(props: {
  state: flow.StateError,
  setState: (s: flow.State) => void,
}) {
  return (
    <div>
      {props.state.message}
      <div className="Buttons">
        <button onClick={() => props.setState(props.state.done())}>OK</button>
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
