import { useSignal } from "@preact/signals";

export default function Counter() {
  const signal = useSignal(0);
  return (
    <div>
      <p>{signal}</p>
      <button
        onClick={() => signal.value += 1}
      >
        +1
      </button>
    </div>
  );
}
