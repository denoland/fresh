import { ComponentChildren } from "preact";

type Props = {
  children: ComponentChildren;
};
export default function Background({ children }: Props) {
  return (
    <div
      class="bg-gray-200 py-16 px-8 flex items-center justify-center rounded"
      style="background-image: url(/gallery/grid.svg)"
    >
      {children}
    </div>
  );
}
