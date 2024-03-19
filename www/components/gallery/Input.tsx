import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function Input(props: JSX.HTMLAttributes<HTMLInputElement>) {
  const wantFocus = !IS_BROWSER && ("autofocus" in props) || ("autoFocus" in props);
  return (
    <input
      {...props}
      disabled={(!IS_BROWSER && !wantFocus) || props.disabled}
      class={`px-3 py-2 bg-white rounded border(gray-500 2) disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    />
  );
}
