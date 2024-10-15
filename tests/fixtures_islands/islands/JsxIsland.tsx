import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type ComponentChildren, isValidElement } from "preact";

export interface JsxIslandProps {
  jsx?: ComponentChildren;
  children?: ComponentChildren;
}

export function JsxIsland(props: JsxIslandProps) {
  const active = useSignal(false);
  const sig = useSignal(0);

  useEffect(() => {
    active.value = true;
  }, []);
  return (
    <div class={active.value ? "ready" : ""}>
      <p class="output">{sig}</p>
      <button class="update" onClick={() => sig.value = sig.peek() + 1}>
        update
      </button>
      <div class="jsx">{props.jsx}</div>
      <div class="children">{props.children}</div>
      <pre>{JSON.stringify({jsx: isValidElement(props.jsx), children: isValidElement(props.children)})}</pre>
    </div>
  );
}
