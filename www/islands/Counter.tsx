import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { RoundedButton } from "../components/Button.tsx";
import * as Icons from "../components/Icons.tsx";

interface CounterProps {
  start: number;
}

export default function Counter(props: CounterProps) {
  const count = useSignal(props.start);

  return (
    <div
      class="bg-green-100 p-8 border-8 border-green-300 text-center"
      style="border-radius: 1rem"
    >
      <h3 class="green-300 text-2xl font-bold text-green-700">
        This area is interactive
      </h3>
      <p class="text-gray-600">
        The server supplied the initial value of 3.
      </p>
      <div
        class="flex justify-between items-center mt-4 mx-auto"
        style="max-width: 20rem"
      >
        <RoundedButton
          title="Subtract 1"
          onClick={() => count.value -= 1}
          disabled={!IS_BROWSER || count.value <= 0}
        >
          <Icons.IconMinus />
        </RoundedButton>
        <div class="text-6xl tabular-nums font-bold">
          {count}
        </div>

        <RoundedButton
          title="Add 1"
          onClick={() => count.value += 1}
          disabled={!IS_BROWSER}
        >
          <Icons.IconPlus />
        </RoundedButton>
      </div>
    </div>
  );
}
