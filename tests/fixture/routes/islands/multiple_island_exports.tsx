import { useSignal } from "@preact/signals";
import CounterZero from "../../islands/MultipleCounters.tsx";
import { CounterOne, CounterTwo } from "../../islands/MultipleCounters.tsx";
import SubfolderCounter from "../../islands/folder/subfolder/Counter.tsx";

export default function Home() {
  return (
    <div>
      <CounterZero id="counter0" count={useSignal(4)} />
      <CounterOne id="counter1" count={useSignal(3)} />
      <CounterTwo id="counter2" count={useSignal(10)} />
      <SubfolderCounter id="counter3" count={useSignal(4)} />
    </div>
  );
}
