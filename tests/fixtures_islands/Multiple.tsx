import type { ComponentChildren } from "preact";
import { Counter } from "./Counter.tsx";
import { useSignal } from "@preact/signals";

export interface MultipleProps {
  id?: string;
  children?: ComponentChildren;
}

export function Multiple1(props: MultipleProps) {
  const sig = useSignal(0);
  return <Counter id={props.id} count={sig} />;
}
export function Multiple2(props: MultipleProps) {
  const sig = useSignal(0);
  return <Counter id={props.id} count={sig} />;
}
