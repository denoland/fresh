import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function ColoredButton(
  props: JSX.HTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class="px-3 py-2 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 active:bg-blue-400"
    />
  );
}
