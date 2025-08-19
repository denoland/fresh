import { useEffect, useState } from "preact/hooks";

export function ReadyIsland() {
  const [ready, set] = useState(false);

  useEffect(() => {
    set(true);
  }, []);

  return (
    <div class={ready ? "ready" : "not-ready"}>
      {ready ? "ready" : "waiting..."}
    </div>
  );
}
