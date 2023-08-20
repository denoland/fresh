import { Signal } from "@preact/signals";

export default function Counter({ count }: { count: Signal<number> }) {
  return (
    <div>
      <p class="count">{count}</p>
      <button class="counter" onClick={() => count.value++}>update</button>
    </div>
  );
}
