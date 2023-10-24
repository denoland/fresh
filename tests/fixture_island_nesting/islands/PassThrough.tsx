import { ComponentChildren } from "preact";

export function PassThrough(props: { children: ComponentChildren }) {
  return <div>{props.children}</div>;
}
