import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function Input(props: JSX.HTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      class={`px-3 py-2 bg-white rounded border(gray-500 2) ${
        props.class ?? ""
      }`}
    />
  );
}
