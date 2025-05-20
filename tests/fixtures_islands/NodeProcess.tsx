import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "@fresh/core/runtime";

export function NodeProcess() {
  const active = useSignal(false);

  useEffect(() => {
    active.value = true;
  }, []);

  // @ts-ignore bundling
  // deno-lint-ignore no-process-global
  const value = IS_BROWSER ? process.env.NODE_ENV : "no";

  return (
    <div class={active.value ? "ready" : ""}>
      value: {value}
    </div>
  );
}
