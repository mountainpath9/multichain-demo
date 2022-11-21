import { TokenMetadata } from "api"

export type SendFlowState
  = { kind: "showing-form" } & StateShowForm
  | { kind: "awaiting-confirmation"} & StateAwaitingConfirmation
  ;

  export interface StateShowForm {
    token: TokenMetadata,
    next(): SendFlowState,
  };

  export interface StateAwaitingConfirmation {
  }

  export function stateShowForm(token: TokenMetadata): { kind: "showing-form"} & StateShowForm {
    return {
      kind:"showing-form",
      token,
      next: stateAwaitingConfirmation,
    }
  }

  export function stateAwaitingConfirmation(): { kind: "awaiting-confirmation"} & StateAwaitingConfirmation {
    return {
      kind:"awaiting-confirmation",
    }
  }