import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";

export function DenoSection() {
  return (
    <PageSection>
      <SideBySide>
        <div class="flex flex-col gap-4">
          <SectionHeading>
            Built on Deno
          </SectionHeading>
          <p>
            Deno is the next evolution of server-side JavaScript, with stronger
            security, a robust built-in toolchain, and zero-config TypeScript
            support. (It's faster than Node, too.)
          </p>
          <FancyLink
            href="https://deno.com"
            class="mt-4"
          >
            Learn more about Deno
          </FancyLink>
        </div>

        <img
          src="/illustration/lemon-squash.svg"
          class="w-full h-auto mx-auto max-w-[24rem] mt-8 mb-4"
          alt="Deno is drinking Fresh lemon squash"
        />
      </SideBySide>
    </PageSection>
  );
}
