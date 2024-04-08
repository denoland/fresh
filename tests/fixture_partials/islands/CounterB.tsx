import { useSignal } from "@preact/signals";
import { Logger } from "./Logger.tsx";

export default function CounterB() {
  const sig = useSignal(0);
  return (
    <Logger name="Counter B">
      <div class="island island-b">
        <p class="output-b">{sig.value}</p>
        <button onClick={() => sig.value += 1}>
          update
        </button>
      </div>
    </Logger>
  );
}
