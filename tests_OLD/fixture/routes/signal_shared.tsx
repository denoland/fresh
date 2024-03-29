import { useSignal } from "@preact/signals";
import Counter from "$fresh/tests/fixture/islands/Counter.tsx";

export default function SignalShared() {
  const sig = useSignal(1);
  return (
    <div>
      <Counter id="counter-1" count={sig} />
      <Counter id="counter-2" count={sig} />
    </div>
  );
}
