/** @jsx h */
import { h, IS_BROWSER, useState } from "../client_deps.ts";
import Inner from "./Inner.tsx";

interface OuterProps {
  start: number;
  id: string;
}

export default function Outer(props: OuterProps) {
  const [count, setCount] = useState(props.start);
  return (
    <div id={props.id}>
      <Inner id="inner1" start={110} />
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
