import { useState } from "preact/hooks";

export default function Stateful(props: { id: string }) {
  const [v, set] = useState(0);
  return (
    <div class="island">
      <p class={`output-${props.id}`}>{v}</p>
      <button class={`btn-${props.id}`} onClick={() => set((v) => v + 1)}>
        update
      </button>
    </div>
  );
}
