import { useSignal } from "@preact/signals";
import lifecycle from "../actions/lifecycle.ts";

export default function ActionIsland() {
  const sig = useSignal(0);

  return (
    <div id="page">
      <h1>action island {sig.value}</h1>
      <pre id="out" />
      {sig.value < 3 ? <div use={lifecycle("it works")} /> : null}
      <button onClick={() => sig.value = sig.peek() + 1}>update</button>
    </div>
  );
}
