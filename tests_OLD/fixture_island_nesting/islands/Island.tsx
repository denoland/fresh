import type { ComponentChildren } from "preact";

export default function Island(props: { children?: ComponentChildren }) {
  return (
    <div class="island">
      {props.children}
    </div>
  );
}
