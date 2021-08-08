/** @jsx h */

import { h, tw } from "../deps.ts";

export function RoundedButton(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      class={tw
        `p-3 border border-transparent rounded-full text-white bg-indigo(600 hover:700) focus:(outline-none ring(2 offset-2 indigo-500)) disabled:(bg-indigo-200 cursor-default)`}
    />
  );
}
