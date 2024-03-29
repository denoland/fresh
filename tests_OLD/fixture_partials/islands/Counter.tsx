import { useSignal } from "@preact/signals";
import { Logger } from "./Logger.tsx";

export default function Counter(props: { id: string }) {
  const sig = useSignal(0);
  return (
    <Logger name={`Counter ${props.id}`}>
      <div class="island">
        <p class={`output-${props.id}`}>{sig.value}</p>
        <button onClick={() => sig.value += 1}>
          update
        </button>
      </div>
    </Logger>
  );
}
