import { useSignal } from "@preact/signals";
import { Logger } from "./Logger.tsx";

export default function CounterA() {
  const sig = useSignal(0);
  return (
    <Logger name="Counter A">
      <div class="island island-a">
        <p class="output-a">{sig.value}</p>
        <button onClick={() => sig.value += 1}>
          update
        </button>
      </div>
    </Logger>
  );
}
