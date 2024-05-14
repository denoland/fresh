import { PageSection } from "$fresh/www/components/PageSection.tsx";
import CopyArea from "../../islands/CopyArea.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function IntroSection(props: { origin: string }) {
  return (
    <PageSection>
      <div class="md:grid grid-cols-5 gap-8 md:gap-16 items-center min-h-[50vh]">
        <div class="flex-1 text-center md:text-left md:col-span-3">
          <p class="italic mb-4 text-gray-400 text-xl">
            Here's a Fresh idea:
          </p>
          <h2 class="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl sm:tracking-tight sm:leading-none! font-black bg-[linear-gradient(170deg_in_oklch,var(--tw-gradient-stops))] from-blue-300 via-green-500 max-w-max to-yellow-300 bg-clip-text text-transparent">
            Web frameworks should be simple, approachable, and productive.
          </h2>
          <div class="mt-12 flex flex-wrap justify-center items-stretch md:justify-start gap-4">
            <FancyLink href="/docs/getting-started">Get started</FancyLink>
            <CopyArea code={`deno run -A -r ${props.origin}`} />
          </div>
        </div>

        <picture class="block mt-8 md:mt-0 mx-auto w-full max-w-sm md:col-span-2">
          <img
            src="/lemon.svg"
            alt=""
            class="w-full max-w-64 xl:max-w-[20rem] mx-auto mb-4"
          />
        </picture>
      </div>
    </PageSection>
  );
}
