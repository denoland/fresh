/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface KebabCaseFileNameTestProps {
  start: number;
  id: string;
}

export default function KebabCaseFileNameTest(
  props: KebabCaseFileNameTestProps,
) {
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
