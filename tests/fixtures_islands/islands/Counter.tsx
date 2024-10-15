import { type Signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export interface CounterProps {
  id?: string;
  count: Signal<number>;
}

export function Counter(props: CounterProps) {
  const active = useSignal(false);
  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div id={props.id} class={active.value ? "ready" : ""}>
      <button class="decrement" onClick={() => props.count.value -= 1}>
        -1
      </button>
      <p class="output">{props.count}</p>
      <button class="increment" onClick={() => props.count.value += 1}>
        +1
      </button>
    </div>
  );
}
