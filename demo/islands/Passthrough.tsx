import { useState } from "preact/hooks";
import { ComponentChildren } from "preact";

interface PassthroughProps {
  children: ComponentChildren;
}

export default function Passthrough({ children }: PassthroughProps) {
  const [v, set] = useState(0);
  return (
    <div class="pass-through" style="padding: 2rem; border: 2px solid blue">
      <h2>This is an Island</h2>
      <button
        onClick={() =>
          set((v2) =>
            v2 + 1
          )}
      >
        update {v}
      </button>
      <div>{children}</div>
    </div>
  );
}
