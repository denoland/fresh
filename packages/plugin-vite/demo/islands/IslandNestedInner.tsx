import { useEffect, useState } from "preact/hooks";

export function IslandNestedInner() {
  const [ready, set] = useState(false);

  useEffect(() => {
    set(true);
  }, []);

  return (
    <div class={ready ? "inner-ready" : ""}>
      <p>Inner</p>
    </div>
  );
}
