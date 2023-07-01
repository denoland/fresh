import { useSignal } from "@preact/signals";
import { ComponentChildren } from "preact";

export default function ActionSlot(props: { children?: ComponentChildren }) {
  const sig = useSignal(0);

  return (
    <div>
      <h1>action slot {sig.value}</h1>
      {sig.value < 1 ? props.children : null}
      <button onClick={() => sig.value = sig.peek() + 1}>update</button>
    </div>
  );
}
