import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export function ReadyMarker() {
  const sig = useSignal(false);
  useEffect(() => {
    sig.value = true;
  }, []);

  return (
    <p class={sig.value ? "mounted" : "pending"}>
      {sig.value ? "mounted" : "pending"}
    </p>
  );
}
