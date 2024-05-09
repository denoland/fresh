import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function CTA() {
  return (
    <PageSection class="text-center">
      <img src="/lemon.svg" alt="Lemon" class="mx-auto w-full max-w-64" />
      <div class="flex flex-col gap-4">
        <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-600 font-extrabold">
          Start your Fresh journey
        </h2>
        <div class="flex flex-col justify-start items-center gap-4">
          <p class="text-xl">
            Jump right in and build your website with Fresh. Learn everything
            you need to know in seconds.
          </p>
          <FancyLink href="/docs/getting-started" class="mt-4">
            Get started
          </FancyLink>
        </div>
      </div>
    </PageSection>
  );
}
