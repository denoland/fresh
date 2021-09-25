/** @jsx h */

import { RoundedButton } from "../components/Button.tsx";
import { IconMinus, IconPlus } from "../components/Icons.tsx";
import { h, IS_BROWSER, PageConfig, tw, useState } from "../deps.ts";

export default function Home() {
  return (
    <div class={tw`max-w-screen-md px-4 mx-auto my-8`}>
      <p class={tw`font-bold`}>
        Welcome to `fresh`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
      <p class={tw`mt-4`}>
        {IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}
      </p>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div class={tw`mt-4 border rounded p-4 text-center`}>
      <p class={tw`text-lg font-medium`}>Current count: {count}</p>
      <div class={tw`flex gap-2 mt-4 justify-center`}>
        <RoundedButton
          type="button"
          onClick={() => setCount(count - 1)}
          disabled={!IS_BROWSER}
        >
          <IconMinus />
        </RoundedButton>
        <RoundedButton
          type="button"
          onClick={() => setCount(count + 1)}
          disabled={!IS_BROWSER}
        >
          <IconPlus />
        </RoundedButton>
      </div>
    </div>
  );
}

export const config: PageConfig = { runtimeJS: true };
