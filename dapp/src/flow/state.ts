
import { TokenMetadata } from "../api";
import { BigNumber } from 'ethers';

export type State = StateHome | StateDepositNew | StateDeposit | StateWithdrawal | StateError;

export interface StateHome {
  kind: "home",
  depositNew(): State,
  deposit(token: TokenMetadata): State,
  withdrawal(token: TokenMetadata, balance: BigNumber): State,
};
  
export interface StateDepositNew {
  kind: "deposit-new",
  cancel(): State,
  deposit(token: TokenMetadata): State,
};

export interface StateDeposit {
  kind: "deposit",
  token: TokenMetadata,
  error(message: string): State,
  done(): State,
}

export interface StateWithdrawal {
  kind: "withdrawal",
  token: TokenMetadata,
  balance: BigNumber,
  error(message: string): State,
  done(): State,
}

export interface StateError {
  kind: "message",
  message: string,
  done(): State,
}


export function stateHome(): State {
  return {
    kind:"home",
    depositNew: stateDepositNew,
    deposit: stateDeposit,
    withdrawal: stateWithdrawal,
  }
}

export function stateDepositNew(): State {
  return {
    kind:"deposit-new",
    cancel: stateHome,
    deposit: stateDeposit,
  }
}

export function stateDeposit(token: TokenMetadata): State {
  return {
    kind:"deposit",
    token,
    done: stateHome,
    error: stateError,
  }
}

export function stateWithdrawal(token: TokenMetadata, balance: BigNumber): State {
  return {
    kind:"withdrawal",
    token,
    balance,
    done: stateHome,
    error: stateError,
  }
}

export function stateError(message: string): State {
  return {
    kind:"message",
    message,
    done: stateHome,
  }
}