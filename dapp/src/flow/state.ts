
import { TokenMetadata } from "../api";
import { BigNumber } from 'ethers';

export type State
  = { kind: "home" } & StateHome
  | { kind: "deposit-new" } & StateDepositNew
  | { kind: "deposit" } & StateDeposit
  | { kind: "withdrawal" } & StateWithdrawal
  | { kind: "error" } & StateError;

export interface StateHome {
  depositNew(): State,
  deposit(token: TokenMetadata): State,
  withdrawal(token: TokenMetadata, balance: BigNumber): State,
};
  
export interface StateDepositNew {
  cancel(): State,
  deposit(token: TokenMetadata): State,
};

export interface StateDeposit {
  token: TokenMetadata,

  error(message: string): State,
  done(): State,
}

export interface StateWithdrawal {
  token: TokenMetadata,
  balance: BigNumber,

  error(message: string): State,
  done(): State,
}

export interface StateError {
  message: string,
  
  done(): State,
}


export function stateHome(): { kind: "home"} & StateHome {
  return {
    kind:"home",
    depositNew: stateDepositNew,
    deposit: stateDeposit,
    withdrawal: stateWithdrawal,
  }
}

export function stateDepositNew(): { kind: "deposit-new"} & StateDepositNew {
  return {
    kind:"deposit-new",
    cancel: stateHome,
    deposit: stateDeposit,
  }
}

export function stateDeposit(token: TokenMetadata): { kind: "deposit" } & StateDeposit {
  return {
    kind:"deposit",
    token,
    done: stateHome,
    error: stateError,
  }
}

export function stateWithdrawal(token: TokenMetadata, balance: BigNumber): { kind: "withdrawal" } & StateWithdrawal {
  return {
    kind:"withdrawal",
    token,
    balance,
    done: stateHome,
    error: stateError,
  }
}

export function stateError(message: string): { kind: "error" } & StateError {
  return {
    kind:"error",
    message,
    done: stateHome,
  }
}