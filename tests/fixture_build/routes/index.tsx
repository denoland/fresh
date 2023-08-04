import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  const signal = useSignal(0);
  return (
    <div>
      <Counter id="counter" count={signal} />
    </div>
  );
}
