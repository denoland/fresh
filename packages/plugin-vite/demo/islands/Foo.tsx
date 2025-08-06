import { useSignal } from "@preact/signals";

export function Foo() {
  const count = useSignal(0);
  return (
    <div>
      <h1>island</h1>
      <button type="button" onClick={() => count.value++}>
        update {count}
      </button>
    </div>
  );
}
