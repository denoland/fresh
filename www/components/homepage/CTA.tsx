import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function CTA() {
  return (
    <PageSection class="text-center bg-gradient-to-b from-green-300 !mb-0 -skew-y-3 xl:-skew-x-3">
      <div class="flex flex-col gap-4 before:bottom-1/4 pt-64 pb-48 skew-y-3 xl:skew-x-3">
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
  );
}
