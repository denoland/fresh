import { JSX } from "preact";

export default function Background(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      class="bg-gray-200 py-16 px-8 flex gap-4 items-center justify-center rounded flex-wrap"
      style="background-image: url(/gallery/grid.svg)"
    />
  );
}
