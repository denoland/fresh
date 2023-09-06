import { ComponentChildren } from "preact";

export function ClickButton(
  props: {
    onClick: (e: MouseEvent) => void;
    children?: ComponentChildren;
  },
) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
