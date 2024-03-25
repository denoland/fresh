import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

export function Logger(props: { children?: ComponentChildren; name?: string }) {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const logs = document.querySelector("#logs");
    if (logs) {
      logs.textContent += `mount ${props.name}\n`;
    }

    return () => {
      if (logs) {
        logs.textContent += `unmount ${props.name}\n`;
      }
    };
  }, []);

  if (mounted.current && typeof document !== "undefined") {
    const logs = document.querySelector("#logs");
    if (logs) {
      logs.textContent += `update ${props.name}\n`;
    }
  }

  // deno-lint-ignore no-explicit-any
  return props.children as any;
}
