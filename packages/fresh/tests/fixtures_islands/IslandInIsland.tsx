import { useSignal } from "@preact/signals";
import { Counter } from "./Counter.tsx";

export function IslandInIsland() {
  const sig = useSignal(0);

  return (
    <div>
      <button
        type="button"
        class="trigger"
        onClick={() => sig.value = sig.peek() + 1}
      >
        trigger
      </button>
      <Counter count={sig} />
    </div>
  );
}
