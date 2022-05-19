/** @jsx h */
import { h, IS_BROWSER, useState } from "../client_deps.ts";

interface InnerProps {
  start: number;
  id: string;
}

export default function Inner(props: InnerProps) {
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
