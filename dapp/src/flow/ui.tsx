import { useState, useEffect } from 'react'
import { BigNumber } from 'ethers';

import { useTypedFieldState, TypedFieldState } from '../util/fields/hooks';
import { ETH_ADDRESS_FIELD, tokenAmountField } from '../util/fields/ethers';
import { Api, TokenMetadata, TxError, TxResult } from "../api";

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
  } else if (state.kind == "awaiting-confirmation") {
      return <AwaitingConfirmationUI 
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

  
export function HomeUI(props: {
  api: Pick<Api, 'getStoreBalances'>,
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
  
  function renderBalance(balance: StoreTokenBalance, i: number) {
    return (
      <tr key={i}>
        <td>{`${balance.token.symbol} (${balance.token.address})`}</td>
        <td>{formatUnits(balance.balance, balance.token.decimals)}</td>
        <td><button className={"TableButton"} onClick={() => deposit(balance)}>Deposit</button></td>
        <td><button className={"TableButton"} onClick={() => withdrawal(balance)}>Withdraw</button></td>
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
        <button className="ActionButton" onClick={depositNew}>Deposit new token</button>
      </div>
    </div>
  );
}

export function DepositNewUI(props: {
  api: Pick<Api, 'getTokenMetadata'>,
  state: flow.StateDepositNew,
  setState: (s: flow.State) => void,
}) {

  const tokenField = useTypedFieldState(ETH_ADDRESS_FIELD);
  const [inProgress, setInProgress] = useState(false);

  const formValid = tokenField.isValid();

  async function go() {
    setInProgress(true);
    const token = await props.api.getTokenMetadata(tokenField.value());
    props.setState(props.state.next(token));
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
        <button className="CancelButton" onClick={cancel} disabled={inProgress}>Back</button>
        <button className="ActionButton" onClick={go} disabled={!formValid || inProgress} >Next</button>
      </div>
    </div>
  );
}

export function DepositUI(props: {
  api: Pick<Api, 'storeApprove' | 'storeDeposit'>,
  state: flow.StateDeposit,
  setState: (s: flow.State) => void,
}) {
  const token = props.state.token;
  const amountField = useTypedFieldState(tokenAmountField(token.decimals));
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid();

  async function cancel() {
    props.setState(props.state.cancel());
  }

  async function go() {
    setInProgress(true);

    const amount = amountField.value();

    async function doDeposit() : Promise<TxResult<void>> {
      const r1 = await props.api.storeApprove(token, amount);
      if (r1.kind != 'success') {
        return r1;
      }
      const r2 = await props.api.storeDeposit(token, amount);
      return r2;
    }
    const action = doDeposit();
    props.setState(props.state.next(action, "Deposit transaction in progress"));
  }

  return (
    <div>
      {`Depositing ${token.symbol} from wallet into store`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button className="CancelButton" onClick={cancel} disabled={inProgress}>Back</button>
        <button className="ActionButton" onClick={go} disabled={!formValid || inProgress} >Next</button>
      </div>
    </div>
  );
}

export function WithdrawalUI(props: {
  api: Pick<Api, 'storeWithdraw'>,
  state: flow.StateWithdrawal,
  setState: (s: flow.State) => void,
}) {
  const token = props.state.token;
  const amountFieldType = tokenAmountField(token.decimals);
  const amountField = useTypedFieldState(amountFieldType);
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid() && amountField.value().lte(props.state.balance);

  async function cancel() {
    props.setState(props.state.cancel());
  }

  async function go() {
    setInProgress(true);
    const amount = amountField.value();
    const action = props.api.storeWithdraw(token, amount);
    setInProgress(false);
    props.setState(props.state.next(action, "Withdrawal transaction in progress"));  
  }

  return (
    <div>
      {`Withdrawing ${token.symbol} from store, available balance is ${amountFieldType.toText(props.state.balance)}`}
      <div className="Form">
      {renderField("Amount", amountField, inProgress)}
      </div>
      <div className="Buttons">
        <button className="CancelButton" onClick={cancel} disabled={inProgress}>Back</button>
        <button className="ActionButton" onClick={go} disabled={!formValid || inProgress} >Next</button>

      </div>
    </div>
  );
}

export function AwaitingConfirmationUI(props: {
  state: flow.StateAwaitingConfirmation,
  setState: (s: flow.State) => void,
}) {

  useEffect(() => {
    async function transitionWhenCompleted() {
      const r = await props.state.action;
      if (r.kind == "success") {
        props.setState(props.state.next());
      } else {
        props.setState(props.state.error(txErrorMessage(r)));

      }
    }

    transitionWhenCompleted();
  }, []);

  return (
    <div className="Waiting">
      {props.state.message}...
      <div className="sbl-circ-ripple"></div>
    </div>
  );
}

function txErrorMessage(error: TxError) {
  switch (error.kind) {
    case "tx-rejected": return "Transaction rejected";
  }
}

export function ErrorUI(props: {
  state: flow.StateError,
  setState: (s: flow.State) => void,
}) {
  return (
    <div>
      {props.state.message}
      <div className="Buttons">
        <button onClick={() => props.setState(props.state.next())}>OK</button>
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
