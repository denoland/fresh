import type { Signal } from "@preact/signals";
import type { ComponentChildren } from "preact";

export default function PartialTrigger(
  props: {
    class: string;
    href: string;
    partial?: string;
    loading?: Signal<boolean>;
    children?: ComponentChildren;
  },
) {
  return (
    <a
      class={props.class}
      href={props.href}
      f-partial={props.partial}
      f-loading={props.loading}
    >
      {props.children}
    </a>
  );
}
