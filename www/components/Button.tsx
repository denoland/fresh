/** @jsx h */
import { h } from "preact";

export function RoundedButton(props: h.JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        touchAction: "manipulation",
      }}
      {...props}
      class="p-3 border border-transparent rounded-full text-white bg-green(500 hover:600) focus:(outline-none ring(2 offset-2 green-500)) disabled:(bg-green-200 cursor-default)"
    />
  );
}
