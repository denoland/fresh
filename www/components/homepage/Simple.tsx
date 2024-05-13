import { PageSection } from "$fresh/www/components/PageSection.tsx";

export function Simple() {
  return (
    <PageSection>
      <div class="text-center max-w-max mx-auto flex flex-col gap-4 relative">
        <img src="/lemon.svg" alt="" class="w-full max-w-64 mx-auto mb-4" />
        <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance text-gray-600 banner-bg">
          The framework so simple, you already know it
        </h2>
        <p class="text-xl text-balance max-w-prose mx-auto">
          Fresh is designed to be easy to use by building on the best well-known
          tools, conventions, and web standards.
        </p>
      </div>
    </PageSection>
  );
}
