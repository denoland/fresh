import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export function SelfCounter() {
  const count = useSignal(0);
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready self-counter" : ""}>
      <button class="decrement" onClick={() => count.value -= 1}>
        -1
      </button>
      <p class="output">{count}</p>
      <button class="increment" onClick={() => count.value += 1}>
        +1
      </button>
    </div>
  );
}
