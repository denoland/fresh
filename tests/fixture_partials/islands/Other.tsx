import { useSignal } from "@preact/signals";
import { Logger } from "./Logger.tsx";

export default function Other() {
  const sig = useSignal(0);
  return (
    <Logger name="Other">
      <div class="island island-other">
        <p class="output-other">{sig.value}</p>
        <button onClick={() => sig.value += 1}>
          update
        </button>
      </div>
    </Logger>
  );
}
