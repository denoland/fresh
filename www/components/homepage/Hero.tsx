import { PageSection } from "$fresh/www/components/PageSection.tsx";
import CopyArea from "../../islands/CopyArea.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";
import LemonDrop from "$fresh/www/islands/LemonDrop.tsx";
import LemonTop from "$fresh/www/islands/LemonTop.tsx";
import LemonBottom from "$fresh/www/islands/LemonBottom.tsx";

export function Hero(props: { origin: string }) {
  return (
    <>
      <div class="bg-green-300 mt-0 pt-32 md:pt-48 !mb-0 bg-gradient-to-br from-blue-100 via-green-200 to-yellow-100">
        <div class="md:grid grid-cols-5 gap-8 md:gap-16 items-center w-full max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 2xl:px-0">
          <div class="flex-1 text-center md:text-left md:col-span-3 pb-8 md:pb-32">
            <h2 class="text-4xl sm:text-5xl lg:text-6xl sm:tracking-tight sm:leading-none! font-extrabold">
              The simple, approachable, productive web framework
            </h2>
            <div class="mt-12 flex flex-wrap justify-center items-stretch md:justify-start gap-4">
              <FancyLink href="/docs/getting-started">Get started</FancyLink>
              <CopyArea code={`deno run -A -r ${props.origin}`} />
            </div>
          </div>
          <div class="md:col-span-2 flex justify-center items-end">
            <LemonTop />
          </div>
        </div>
      </div>
      <LemonBottom />
    </>
  );
}
