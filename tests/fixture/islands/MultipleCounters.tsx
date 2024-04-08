import type { Signal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface CounterProps {
  count: Signal<number>;
  id: string;
}

export const thisShouldNotCauseProblems = 42;

export default function CounterZero(props: CounterProps) {
  return (
    <div id={props.id}>
      <p>{props.count}</p>
      <button
        id={`b-${props.id}`}
        onClick={() => props.count.value += 1}
        disabled={!IS_BROWSER}
      >
        +1
      </button>
    </div>
  );
}

export function CounterOne(props: CounterProps) {
  return CounterZero(props);
}

export function CounterTwo(props: CounterProps) {
  return CounterZero(props);
}
