import { useSignal } from "@preact/signals";
import Counter from "./(_islands)/Counter.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter" count={useSignal(3)} />
    </div>
  );
}
