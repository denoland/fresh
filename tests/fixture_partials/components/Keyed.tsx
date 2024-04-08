import { ComponentChildren } from "preact";

export function Keyed(props: { children?: ComponentChildren }) {
  return <>{props.children}</>;
}
