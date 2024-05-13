import { PageSection } from "$fresh/www/components/PageSection.tsx";

export function Simple() {
  return (
    <PageSection>
      <div class="text-center max-w-max mx-auto flex flex-col gap-4 relative">
        <img src="/lemon.svg" alt="" class="w-full max-w-64 mx-auto mb-4" />
        <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance text-gray-600 before:w-full md:before:w-2/3 md:before:left-[16.66%] before:absolute before:h-1/2 before:bg-fresh before:-z-10 before:-bottom-8 md:before:bottom-0 before:left-0 before:-skew-y-3 before:-skew-x-3 before:bg-gradient-to-r from-yellow-200 via-green-300 to-blue-200">
          The framework so simple, you already know it
        </h2>
        <p class="text-xl text-balance max-w-prose mx-auto">
          Fresh is designed to be approachable and easy to use by building on
          the best well-known tools, conventions, and web standards.
        </p>
      </div>
    </PageSection>
  );
}
