import { useEffect, useState } from "preact/hooks";
import { IslandNestedInner } from "./IslandNestedInner.tsx";

export function IslandNestedOuter() {
  const [ready, set] = useState(false);

  useEffect(() => {
    set(true);
  }, []);

  return (
    <div class={ready ? "outer-ready" : ""}>
      <p>Outer</p>
      <IslandNestedInner />
    </div>
  );
}
