import * as flow from "./state";
import { useEffect } from 'react'
import { TypedFieldState, useTypedFieldState } from "../../util/fields/hooks";
import { ETH_ADDRESS_FIELD, tokenAmountField } from "../../util/fields/ethers";

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

  const token = props.state.token;
  const amountField = useTypedFieldState(tokenAmountField(token.decimals));
  const addressField = useTypedFieldState(ETH_ADDRESS_FIELD);

  function onNext() {
    props.setState(props.state.next());
  }

  return (
    <div>
      <p>Sending {props.state.token.symbol} on network {props.state.token.config.chainId}...</p>
      <div className="Form">
        {renderField("amount", amountField, false)}
        {renderField("to address", addressField, false)}
      </div>
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

function renderField<T>(label: String, field: TypedFieldState<T>, disabled: boolean) {
  return (
    <div className="Field">
      <div>{label}:</div>
      <input value={field.text} onChange={e => field.setText(e.target.value)}  disabled={disabled}/>
      {field.isValid() ? null : <div className="Field-Error"> ← {field.validationError()}</div>}
    </div>
  );
}
