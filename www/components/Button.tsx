import { JSX } from "preact";

export function RoundedButton(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        touchAction: "manipulation",
      }}
      {...props}
      class="p-3 border border-transparent rounded-full text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-200 disabled:cursor-default"
    />
  );
}
