import { useSignal } from "@preact/signals";

export default function FooIsland() {
  const sig = useSignal(0);
  return (
    <button onClick={() => sig.value = sig.peek() + 1}>
      update {sig.value}
    </button>
  );
}
