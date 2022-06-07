/** @jsx h */
import { h, IS_BROWSER, useState } from "$fresh/runtime.ts";

interface CounterProps {
  start: number;
  id: string;
}

export default function Counter(props: CounterProps) {
  const [count, setCount] = useState(props.start);
  return (
    <div id={props.id}>
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
