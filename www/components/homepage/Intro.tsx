import { PageSection } from "$fresh/www/components/PageSection.tsx";
import CopyArea from "../../islands/CopyArea.tsx";

export function IntroSection(props: { origin: string }) {
  return (
    <PageSection>
      <div class="max-w-screen-xl mx-auto sm:my-8 md:my-16 w-full">
        <div class="md:grid grid-cols-5 gap-8 md:gap-16 items-center">
          <div class="flex-1 text-center md:text-left md:col-span-3">
            <h2 class="text-5xl sm:text-5xl lg:text-6xl sm:tracking-tight sm:leading-[1.1]! font-extrabold bg-[linear-gradient(170deg_in_oklch,var(--tw-gradient-stops))] from-yellow-300 via-green-500 max-w-max to-blue-300 bg-clip-text text-transparent">
              The simple, approachable, productive web&nbsp;framework.
            </h2>

            <p class="mt-2 text-gray-600 text-xl">
              Built for speed, reliability, and simplicity.
            </p>
            <div class="mt-12 flex flex-wrap justify-center items-stretch md:justify-start gap-4">
              <a
                href="/docs/getting-started"
                class="font-semibold inline-flex w-auto shrink-0 py-4 px-6 bg-gradient-to-br from-green-200 to-green-400 rounded border-green-100 border-[1.5px] hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap items-center"
              >
                Get started
              </a>
              <div class="flex justify-center">
                <CopyArea code={`deno run -A -r ${props.origin}`} />
              </div>
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
