import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

export interface JsxConditionalProps {
  jsx?: ComponentChildren;
  children?: ComponentChildren;
}

export function JsxConditional(props: JsxConditionalProps) {
  const active = useSignal(false);
  const sig = useSignal(0);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready" : ""}>
      <p class="cond-output">{sig}</p>
      <button class="cond-update" onClick={() => sig.value = sig.peek() + 1}>
        update
      </button>
      <div class="jsx">{active.value ? props.jsx : null}</div>
      <div class="children">{active.value ? props.children : null}</div>
    </div>
  );
}
