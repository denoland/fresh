import { useSignal } from "@preact/signals";
import type { JSX } from "preact";

export function DemoIsland(): JSX.Element {
  const count = useSignal(0);

  return (
    <div style="display: flex; gap: 1rem; padding: 2rem;">
      <button type="button" onClick={() => (count.value -= 1)}>-1</button>
      <p style="font-variant-numeric: tabular-nums;">{count}</p>
      <button type="button" onClick={() => (count.value += 1)}>+1</button>
    </div>
  );
}
