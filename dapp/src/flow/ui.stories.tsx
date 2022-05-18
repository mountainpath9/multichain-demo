import React from 'react';
import { parseUnits} from 'ethers/lib/utils';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { BigNumber } from "ethers";


import * as ui from './ui';
import * as state from './state';
import * as api from '../api';

import '../App.css';
import { syncBuiltinESMExports } from 'module';

storiesOf('Store/Whole Flow', module)
  .add('Flow', () => {
    return <ui.FlowUi
      api={fakeApi}
      />;
  })
;

storiesOf('Store/Flow Components', module)
  .add('Home (empty)', () => {
    return <ui.HomeUI
      state={state.stateHome()}
      api={{
        getStoreBalances: async () => {return []}
      }}
      setState={action('next state')}
      />;
  })
  .add('Home', () => {
    return <ui.HomeUI
      state={state.stateHome()}
      api={{
        getStoreBalances: async () => {return TEST_BALANCES;}
      }}
      setState={action('next state')}
      />;
  })
  .add('DepositNew', () => {
    return <ui.DepositNewUI
      state={state.stateDepositNew()}
      api={{
        getTokenMetadata: async () => {return testToken("DTK1", "0xabcd")},
      }}
      setState={action('next state')}
      />;
  })
  .add('Deposit', () => {
    return <ui.DepositUI
      state={state.stateDeposit(testToken("DTK1", "0xabcd"))}
      api={{
        storeApprove: async (token, amount) => {action('storeApprove')(); return {kind:'success', result: undefined}},
        storeDeposit: async (token, amount) => {action('storeDeposit')(); return {kind:'success', result: undefined}},
      }}
      setState={action('next state')}
      />;
  })
  .add('Withdraw', () => {
    return <ui.WithdrawalUI
      state={state.stateWithdrawal(testToken("DTK1", "0xabcd"), parseUnits("13"))}
      api={{
        storeWithdraw: async (token, amount) => {action('storeWithdraw')(); return {kind:'success', result: undefined}},
      }}
      setState={action('next state')}
      />;
  })
  .add('AwaitingConfirmation', () => {
    return <ui.AwaitingConfirmationUI
      state={state.stateAwaitingConfirmation(
        (async () => {await sleep(5000); return {kind:"success",result:undefined}})(),
        "Waiting for something"
      )}
      setState={action('next state')}
      />;
  })
  .add('Error', () => {
    return <ui.ErrorUI
      state={state.stateError("Something went wrong")}
      setState={action('next state')}
      />;
  })
;

const TEST_BALANCES: api.StoreTokenBalance[] = [
  {token:testToken("DTK1", "0xabcd000000000000000000000000000000000000"), balance: parseUnits("22")},
  {token:testToken("DTK2", "0x5432000000000000000000000000000000000000"), balance: parseUnits("13")},
];

function testToken(symbol: string, address: string): api.TokenMetadata {
  return {
    symbol,
    address,
    name: "??",
    decimals: 18
  }
}

// Fake just enough API functionality to make the UI work.

const fakeApi: api.Api = (function(): api.Api {
  const balances = [...TEST_BALANCES];

  async function getTokenMetadata (address: string): Promise<api.TokenMetadata> {
    for(let b of balances) {
      if (address == b.token.address) {
        return b.token;
      }
    }
    throw new Error("Token not found");
  }

  async function storeApprove(token: api.TokenMetadata, amount: BigNumber): api.TxPromise<void> {
    action('storeApprove')();
    await sleep(1000);
    return {kind:'success', result: undefined};
  }
  async function storeDeposit(token: api.TokenMetadata, amount: BigNumber): api.TxPromise<void> {
    action('storeDeposit')();
    await sleep(1000);
    if (amount.gte(parseUnits("10"))) {
      // A way to trigger an error
      return {kind:'tx-rejected'};
    }
    for(let b of balances) {
      if (token.address == b.token.address) {
        b.balance = b.balance.add(amount);
      }
    }
    return {kind:'success', result: undefined};
  }
      
  async function storeWithdraw(token: api.TokenMetadata, amount: BigNumber): api.TxPromise<void> {
    action('storeWithdraw')();    
    await sleep(1000);
    for(let b of balances) {
      if (token.address == b.token.address) {
        if (amount.gt(b.balance)) {
          return {kind:'tx-rejected'};
        }
        b.balance = b.balance.sub(amount);
        return {kind:'success', result: undefined};
      }
    }
    return {kind:'tx-rejected'};
  }
      
  async function getStoreBalances(): Promise<api.StoreTokenBalance[]> {
    return balances;
  }

  return {
    getTokenMetadata,
    storeApprove,
    storeDeposit,
    storeWithdraw,
    getStoreBalances,
  };

})();

function sleep(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms));
}
