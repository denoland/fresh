import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter1" count={useSignal(3)} />
    </div>
  );
}
