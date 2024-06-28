import { useSignal } from "@preact/signals";

export default function DemoIsland() {
  const count = useSignal(0);

  return (
    <div style="display: flex; gap: 1rem; padding: 2rem;">
      <button onClick={() => (count.value -= 1)}>-1</button>
      <p style="font-variant-numeric: tabular-nums;">{count}</p>
      <button onClick={() => (count.value += 1)}>+1</button>
    </div>
  );
}
