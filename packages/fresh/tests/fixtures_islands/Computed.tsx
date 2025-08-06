import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export function ComputedSignal(props: { id?: string }) {
  const status = useSignal("it doesn't work");
  const c = useComputed(() => 1);

  const active = useSignal(false);
  useEffect(() => {
    active.value = true;
  }, []);

  return (
    <div id={props.id} class={active.value ? "ready" : ""}>
      <button
        type="button"
        class="trigger"
        onClick={() => {
          try {
            // This should throw
            // deno-lint-ignore no-explicit-any
            (c as any).value = 10;
            status.value = "it doesn't work";
          } catch {
            status.value = "it works";
          }
        }}
      >
        trigger
      </button>
      <p class="output">{status}</p>
    </div>
  );
}
