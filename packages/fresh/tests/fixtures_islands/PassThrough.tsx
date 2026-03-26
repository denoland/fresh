import type { ComponentChildren } from "preact";

export function PassThrough(props: { children?: ComponentChildren }) {
  return (
    <div class="passthrough">
      {props.children}
    </div>
  );
}
