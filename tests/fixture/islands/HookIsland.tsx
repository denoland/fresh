import { useState } from "preact/hooks";

export function HookIsland() {
  const [v, set] = useState(0);
  return (
    <div>
      <p>{v}</p>
      <button onClick={() => set((v) => v + 1)}>update</button>
    </div>
  );
}
