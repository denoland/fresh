import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function CTA() {
  return (
    <div
      class="bg-gradient-to-br from-blue-100 via-green-200 to-yellow-100 pb-32"
      style="clip-path: polygon(0% 10%, 0% 100%, 100% 100%, 100% 0%)"
    >
      <PageSection class="text-center">
        <div class="flex flex-col gap-4">
          <img
            src="/lemon.svg"
            alt="Illustration of a lemon sliced cleanly in half, suspended in midair as though frozen in time the instant after the cut, the juice flung from the edges"
            class="w-full max-w-64 mx-auto mb-8"
          />
          <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 font-extrabold">
            Start your Fresh journey
          </h2>
          <div class="flex flex-col justify-start items-center gap-4">
            <p class="text-xl">
              Jump right in and build your website with Fresh. Learn everything
              you need to know in seconds.
            </p>
            <FancyLink
              href="/docs/getting-started"
              class="mx-auto mt-4"
            >
              Get started
            </FancyLink>
          </div>
        </div>
      </PageSection>
    </div>
  );
}
