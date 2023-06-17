import { useState } from "preact/hooks";
import { ComponentChildren } from "preact";

interface PassthroughProps {
  children: ComponentChildren;
  n: number;
}

export default function Passthrough({ children, n }: PassthroughProps) {
  const [v, set] = useState(0);
  return (
    <div
      class="pass-through"
      style="background: #85efac; padding: 1rem; border: 4px solid blue; border-radius: .5rem; margin: 1rem;"
    >
      <h2>This is an Island #{n}</h2>
      <button
        onClick={() => set((v2) => v2 + 1)}
      >
        update {v}
      </button>
      <div style="padding: 1rem 0">{children}</div>
    </div>
  );
}
