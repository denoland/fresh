import { useState } from "preact/hooks";

export function Bar() {
  const [count, set] = useState(0);
  return (
    <div>
      <h1>island asdf</h1>
      <button type="button" onClick={() => set((v) => v + 1)}>
        update {count}
      </button>
    </div>
  );
}
