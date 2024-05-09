import { JSX } from "preact";

export function PageSection(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      class={`w-full max-w-screen-xl mx-auto my-8 sm:my-16 md:my-24 lg:my-32 px-4 md:px-8 lg:px-16 2xl:px-0 flex flex-col gap-8 md:gap-16 ${
        props.class ?? ""
      }`}
    >
      {props.children}
    </section>
  );
}
