import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

export function CounterWithSlots(
  props: { children?: ComponentChildren; jsx?: ComponentChildren },
) {
  const sig = useSignal(0);
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready" : ""}>
      <div class="counter-with-children">
        <p class="output">{sig}</p>
        <button onClick={() => sig.value = sig.peek() + 1}>update</button>
      </div>
      <div class="children">
        {props.children}
      </div>
      <div class="jsx">
        {props.jsx}
      </div>
    </div>
  );
}
