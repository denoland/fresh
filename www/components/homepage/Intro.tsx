import { PageSection } from "$fresh/www/components/PageSection.tsx";
import CopyArea from "../../islands/CopyArea.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function IntroSection(props: { origin: string }) {
  return (
    <PageSection>
      <div class="max-w-screen-xl mx-auto w-full">
        <div class="md:grid grid-cols-5 gap-8 md:gap-16 items-center">
          <div class="flex-1 text-center md:text-left md:col-span-3">
            <h2 class="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl sm:tracking-tight sm:leading-none! font-black bg-[linear-gradient(170deg_in_oklch,var(--tw-gradient-stops))] from-yellow-300 via-green-500 max-w-max to-blue-300 bg-clip-text text-transparent">
              The simple, approachable, productive web framework.
            </h2>

            <p class="mt-2 text-gray-600 text-xl">
              Built for speed, reliability, and simplicity.
            </p>
            <div class="mt-12 flex flex-wrap justify-center items-stretch md:justify-start gap-4">
              <FancyLink href="/docs/getting-started">Get started</FancyLink>
              <CopyArea code={`deno run -A -r ${props.origin}`} />
            </div>
          </div>

          <picture class="block mt-8 md:mt-0 mx-auto w-full max-w-sm md:col-span-2">
            <img
              src="/illustration/lemon-squash.svg"
              width={800}
              height={678}
              alt="Deno is drinking Fresh lemon squash"
            />
          </picture>
        </div>
      </div>
    </PageSection>
  );
}
