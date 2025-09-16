import { useEffect, useState } from "preact/hooks";

export function Ready() {
  const [ready, set] = useState(false);
  useEffect(() => {
    set(true);
  }, []);
  return <p class={ready ? "ready" : ""}>{ready ? "ok" : "not ok"}</p>;
}
