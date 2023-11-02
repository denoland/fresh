import { useSignal } from "@preact/signals";
import Counter from "https://deno.land/x/fresh@1.5.2/tests/fixture/islands/Counter.tsx";
import Counter2 from "https://deno.land/x/fresh@1.5.2/tests/fixture/islands/folder/Counter.tsx";

export default function Home() {
  const count = useSignal(3);
  const count2 = useSignal(10);
  return (
    <div>
      <Counter count={count} id="counter1" />
      <Counter2 count={count2} id="counter2" />
    </div>
  );
}
