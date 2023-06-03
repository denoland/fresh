import type { Signal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import isNumber from "npm:is-number";

interface CounterProps {
  count: Signal<number>;
  id: string;
}

export default function Counter(props: CounterProps) {
  if (!isNumber(props.count)) throw new TypeError("count must be a number");
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
