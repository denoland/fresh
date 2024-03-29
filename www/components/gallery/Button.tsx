import type { JSX } from "preact";
import { IS_BROWSER } from "@fresh/core/runtime";

export default function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class={`px-3 py-2 bg-white rounded border(gray-500 2) hover:bg-gray-200 active:bg-gray-300 disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    />
  );
}
