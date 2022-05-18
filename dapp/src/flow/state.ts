
import { TokenMetadata, TxResult } from "../api";
import { BigNumber } from 'ethers';

export type State
  = { kind: "home" } & StateHome
  | { kind: "deposit-new" } & StateDepositNew
  | { kind: "deposit" } & StateDeposit
  | { kind: "withdrawal" } & StateWithdrawal
  | { kind: "awaiting-confirmation"} & StateAwaitingConfirmation
  | { kind: "error" } & StateError;

export interface StateHome {
  depositNew(): State,
  deposit(token: TokenMetadata): State,
  withdrawal(token: TokenMetadata, balance: BigNumber): State,
};
  
export interface StateDepositNew {
  cancel(): State,
  next(token: TokenMetadata): State,
};

export interface StateDeposit {
  token: TokenMetadata,

  cancel(): State,
  next(action: Promise<TxResult<void>>, message : string): State,
}

export interface StateWithdrawal {
  token: TokenMetadata,
  balance: BigNumber,

  cancel(): State,
  next(action: Promise<TxResult<void>>, message : string): State,
}

export interface StateAwaitingConfirmation {
  action: Promise<TxResult<void>>,  // The action that we are awaiting
  message: string,                  // The message we want to show whilst waiting

  error(message: string): State,
  next(): State,
}

export interface StateError {
  message: string,
  
  next(): State,
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
    next: stateDeposit,
  }
}

export function stateDeposit(token: TokenMetadata): { kind: "deposit" } & StateDeposit {
  return {
    kind:"deposit",
    token,
    cancel: stateHome,
    next: stateAwaitingConfirmation,
  }
}

export function stateWithdrawal(token: TokenMetadata, balance: BigNumber): { kind: "withdrawal" } & StateWithdrawal {
  return {
    kind:"withdrawal",
    token,
    balance,
    cancel: stateHome,
    next: stateAwaitingConfirmation,
  }
}

export function stateAwaitingConfirmation(action: Promise<TxResult<void>>, message: string): {kind: "awaiting-confirmation"} & StateAwaitingConfirmation {
  return {
    kind:"awaiting-confirmation",
    action,
    message,
    error: stateError,
    next: stateHome,
  };
}

export function stateError(message: string): { kind: "error" } & StateError {
  return {
    kind:"error",
    message,
    next: stateHome,
  }
}