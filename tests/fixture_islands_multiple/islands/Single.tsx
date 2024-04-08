import { useSignal } from "@preact/signals";

export default function Single() {
  const sig = useSignal(0);

  return (
    <div class="island single">
      <p>Single Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}
