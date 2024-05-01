import { JSX } from "preact";

export function DemoBox(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div class="bg-[linear-gradient(135deg_in_oklch,var(--tw-gradient-stops))] from-yellow-200 via-green-300 to-blue-200 p-8 text-center rounded-lg items-center flex justify-center">
      {props.children}
    </div>
  );
}
