import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";

export function SocialProof() {
  return (
    <PageSection>
      <div class="text-center max-w-max mx-auto flex flex-col gap-4">
        <h2 class="text-gray-600 text-4xl sm:text-5xl md:text-6xl lg:text-7xl sm:tracking-tight sm:leading-[1.1]! font-extrabold text-balance">
          Built for the edge
        </h2>
        <p class="text-xl text-balance max-w-prose mx-auto">
          Fresh is the secret sauce behind production-grade, enterprise-ready
          software like{" "}
          <a href="https://deco.cx" class="underline">Deco.cx</a>, Brazil's top
          eCommerce platform
        </p>
      </div>
      <a href="https://deno.com/blog/deco-cx-subhosting-serve-their-clients-storefronts-fast">
        <img
          src="/showcase/deco.webp"
          alt="Deco CX"
          class="mx-auto"
          loading="lazy"
        />
      </a>
      <div class="flex flex-col gap-8 items-center justify-center my-8">
        <blockquote class="text-center italic text-lg md:text-xl lg:text-2xl text-gray-600 font-normal border-l-yellow-300 max-w-prose mx-auto">
          <span class="font-extrabold inline-block transform scale-[2] relative -left-3 top-2 text-fresh leading-none">
            “
          </span>The team also used{" "}
          <b>Fresh</b>, a next-gen Deno-native full stack web framework that
          sends zero JavaScript to the client, for its modern developer
          experience and snappy performance…<br />
          <br />This stack unlocked{" "}
          <b>
            5x faster page load speeds and a 30% jump in conversion rates
          </b>{" "}
          for their
          clients.<span class="font-extrabold inline-block transform scale-[2] relative -right-2 top-2 text-fresh leading-none">
            ”
          </span>
        </blockquote>
        <FancyLink
          href="https://deno.com/blog/deco-cx-subhosting-serve-their-clients-storefronts-fast"
          class="mt-8"
        >
          Read the case study
        </FancyLink>
      </div>
    </PageSection>
  );
}
