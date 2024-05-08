import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export interface SelfCounterProps {
  id?: string;
}

export function SelfCounter(props: SelfCounterProps) {
  const count = useSignal(0);
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div id={props.id} class={active.value ? "ready self-counter" : ""}>
      <button type="button" class="decrement" onClick={() => count.value -= 1}>
        -1
      </button>
      <p class="output">{count}</p>
      <button type="button" class="increment" onClick={() => count.value += 1}>
        +1
      </button>
    </div>
  );
}
