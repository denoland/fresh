import { useSignal } from "@preact/signals";

export default function KeyExplorer() {
  const sig = useSignal(0);

  return (
    <div class="island">
      <h1>counter</h1>
      <p class="output">{sig.value}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}
