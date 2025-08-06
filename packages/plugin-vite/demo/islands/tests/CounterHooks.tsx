import { useState } from "preact/hooks";

export function CounterHooks() {
  const [count, set] = useState(0);

  return (
    <div class="counter-hooks">
      <button type="button" onClick={() => set((v) => v + 1)}>
        count: {count}
      </button>
    </div>
  );
}
