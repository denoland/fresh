import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export function EscapeIsland(props: { str: string }) {
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div class={active.value ? "ready" : ""}>
      it works
    </div>
  );
}
