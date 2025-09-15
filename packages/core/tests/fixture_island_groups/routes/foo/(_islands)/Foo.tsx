import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export function Foo() {
  const active = useSignal(false);
  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div id="foo" class={active.value ? "ready" : ""}>
      {active.value ? "it works" : "it doesn't work"}
    </div>
  );
}
