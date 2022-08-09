/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { RoundedButton } from "../components/Button.tsx";
import { IconMinus, IconPlus } from "../components/Icons.tsx";

interface CounterProps {
  start: number;
}

export default function Counter(props: CounterProps) {
  const [count, setCount] = useState(props.start);
  return (
    <div class="bg-gray-100 p-4 border border-gray-200 flex items-center justify-around">
      <RoundedButton
        title="Subtract 1"
        onClick={() => setCount(count - 1)}
        disabled={!IS_BROWSER || count <= 0}
      >
        <IconMinus />
      </RoundedButton>
      <div class="text-3xl tabular-nums">{count}</div>
      <RoundedButton
        title="Add 1"
        onClick={() => setCount(count + 1)}
        disabled={!IS_BROWSER}
      >
        <IconPlus />
      </RoundedButton>
    </div>
  );
}
