import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function Map() {
  const ready = useSignal(false);
  const count = useSignal(0);

  useEffect(() => {
    ready.value = true;
  }, []);

  return (
    <div class={ready.value ? "ready" : ""}>
      <p class="output">{count.value}</p>
      <button
        type="button"
        class="increment"
        onClick={() => count.value = count.peek() + 1}
      >
        increment
      </button>
    </div>
  );
}
