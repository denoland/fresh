/** @jsx h */

import { h } from "$fresh/runtime.ts";
import { tw } from "../utils/twind.ts";

export function RoundedButton(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      class={tw
        `p-3 border border-transparent rounded-full text-white bg-green(500 hover:600) focus:(outline-none ring(2 offset-2 green-500)) disabled:(bg-green-200 cursor-default)`}
    />
  );
}
