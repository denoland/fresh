import { PageSection } from "../../components/PageSection.tsx";

export function Simple() {
  return (
    <PageSection class="!mb-12 !mt-20">
      <div class="text-center max-w-max mx-auto flex flex-col gap-4">
        <p class="italic text-gray-500 text-lg">Introducing Fresh:</p>
        <h2 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance text-gray-600">
          The framework so simple, you already know it.
        </h2>
        <p class="text-xl text-balance max-w-prose mx-auto">
          Fresh is designed to be easy to use by building on the best well-known
          tools, conventions, and web standards.
        </p>
      </div>
    </PageSection>
  );
}
