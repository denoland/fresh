import { ComponentChildren } from "preact";

export function SectionHeading(
  { children }: { children: ComponentChildren },
) {
  return (
    <h2 class="text-3xl lg:text-4xl xl:text-5xl text-gray-600 font-bold text-balance">
      {children}
    </h2>
  );
}
