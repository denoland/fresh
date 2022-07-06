/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import Counter from "./Counter.tsx";

interface OuterProps {
  start: number;
  id: string;
}

export default function Outer(props: OuterProps) {
  const [count, setCount] = useState(props.start);
  return (
    <div id={props.id}>
      <Counter id="inner1" start={110} />
      <p>{count}</p>
      <button
        id={`b-${props.id}`}
        onClick={() => setCount(count + 1)}
        disabled={!IS_BROWSER}
      >
        +1
      </button>
    </div>
  );
}
