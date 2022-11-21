import * as flow from "./state";
import { useState, useEffect } from 'react'
import { TokenMetadata } from "api";
import { MetamaskConnection } from "types";

interface FlowProps {
  onDone(): void,

  state: flow.SendFlowState,
  setState(s: flow.SendFlowState): void,
}

export function SendFlowUi(props: FlowProps) {
  if (props.state.kind == "showing-form") {
    return <FormUI
      flowProps={props}
      state={props.state}
      setState={props.setState}
    />
  } else {
    return <AwaitingConfirmationUI 
      flowProps={props}
      state={props.state}
      setState={props.setState}
    />;
  } 
}


function FormUI(props: {
  flowProps: FlowProps,
  state: flow.StateShowForm,
  setState: (s: flow.SendFlowState) => void,
}) {

  function onNext() {
    props.setState(props.state.next());
  }

  return (
    <div>
      <p>Sending {props.state.token.symbol} on network {props.state.token.config.chainId}...</p>
      <div className="Buttons">
        <button className="CancelButton" onClick={props.flowProps.onDone}>Cancel</button>
        <button className="ActionButton" onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

function AwaitingConfirmationUI(props: {
  flowProps: FlowProps,
  state: flow.StateAwaitingConfirmation,
  setState: (s: flow.SendFlowState) => void,
}) {

  useEffect(() => {
    setTimeout(props.flowProps.onDone,2000);
  }, []);

  return (
    <div>
      <p>Awaiting tx confirmation...</p>
    </div>
  );
}