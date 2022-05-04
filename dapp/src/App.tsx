import { useState, useEffect } from 'react'
import { BigNumber, ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

import {TokenStore} from "types/typechain/TokenStore";
import {TokenStore__factory} from "types/typechain/factories/TokenStore__factory";

import './App.css'
import { useTypedFieldState, TypedFieldState } from './util/fields/hooks';
import { ETH_ADDRESS_FIELD, tokenAmountField } from './util/fields/ethers';
import { TokenMetadata, getTokenMetadata, connectToken } from './util/tokens';
import { CONFIG } from "./configs/local";

interface Context {
  provider: ethers.providers.Provider,
  signer: ethers.Signer,
  network: ethers.providers.Network,
  tokenStore: TokenStore,
};

function App() {

  const [context, setContext] = useState<Context| null>(null);

  async function metamaskConnect() {
    if (typeof window !== undefined) {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner();
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const tokenStore = TokenStore__factory.connect(CONFIG.tokenStoreAddress, signer);
      setContext({
        provider,
        signer,
        network,
        tokenStore,
      });
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
      {context == null ? renderConnect() : <AppUi ctx={context}/>}
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

function AppUi(props: {ctx: Context}) {

  const [storeBalances, setStoreBalances] = useState<StoreTokenBalance[]| null>(null);
  const [modal, setModal] = useState<ModalState| null>(null);

  async function loadBalances() {
    const balances: StoreTokenBalance[] = [];
    for(let b of await props.ctx.tokenStore.getBalances()) {
      const token = await getTokenMetadata(b.erc20Token, props.ctx.signer);

      balances.push({
        token,
        balance: b.balance,
      });
    }
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
        ctx={props.ctx}
        onContinue={showDeposit}
        onClose={closeModal}
      />;
    } else if (modal.kind == "deposit") {
      return <DepositModal 
        ctx={props.ctx} 
        token={modal.token} 
        onClose={closeModal}
      />;
    } else {
      return <WithdrawalModal 
        ctx={props.ctx}
        ctx2={modal}
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
  ctx: Context,
  onContinue: (token: TokenMetadata) => void;
  onClose: () => void,
}) {

  const tokenField = useTypedFieldState(ETH_ADDRESS_FIELD);
  const [inProgress, setInProgress] = useState(false);

  const formValid = tokenField.isValid();

  async function go() {
    setInProgress(true);
    const token = await getTokenMetadata(tokenField.value(), props.ctx.signer);
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
  ctx: Context,
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
    const signerAddr = await props.ctx.signer.getAddress();
    console.log("Allowance", props.token.address,  amount, signerAddr);
    const token = await connectToken(props.token.address, props.ctx.signer);
    const tx1 = await token.approve(props.ctx.tokenStore.address, amount);
    await tx1.wait();

    // Deposit tokens to the store
    console.log("Deposit", props.token.address, amount, signerAddr);
    const tx2 = await props.ctx.tokenStore.connect(props.ctx.signer).deposit(props.token.address, amount);
    await tx2.wait();

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
  ctx: Context,
  ctx2: ModalWithdrawal,
  onClose: () => void,
}) {


  const amountFieldType = tokenAmountField(props.ctx2.token.decimals);
  const amountField = useTypedFieldState(amountFieldType);
  const [inProgress, setInProgress] = useState(false);

  const formValid = amountField.isValid();

  async function go() {
    setInProgress(true);

    const amount = amountField.value();

    // Withdraw tokens from the store
    const tx1 = await props.ctx.tokenStore.connect(props.ctx.signer).withdraw(props.ctx2.token.address, amount);
    await tx1.wait();

    setInProgress(false);
    props.onClose();
  }

  return (
    <div>
      {`Withdrawing ${props.ctx2.token.symbol} from store, available balance is ${amountFieldType.toText(props.ctx2.balance)}`}
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
