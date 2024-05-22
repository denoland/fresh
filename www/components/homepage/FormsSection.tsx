import { PageSection } from "$fresh/www/components/PageSection.tsx";
import { SideBySide } from "$fresh/www/components/SideBySide.tsx";
import { CodeWindow } from "$fresh/www/components/CodeWindow.tsx";
import { CodeBlock } from "$fresh/www/components/CodeBlock.tsx";
import { SectionHeading } from "$fresh/www/components/homepage/SectionHeading.tsx";
import { DemoBox } from "$fresh/www/components/homepage/DemoBox.tsx";
import { ExampleArrow } from "$fresh/www/components/homepage/ExampleArrow.tsx";
import { FancyLink } from "$fresh/www/components/FancyLink.tsx";
import { FormSubmitDemo } from "../../islands/FormSubmitDemo.tsx";

const routingCode = `import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req) {
    const form = await req.formData();

    // Do something with the form data here,
    // then redirect user to thank you page

    const headers = new Headers();
    headers.set("location", "/thanks");
    return new Response(null, {
      status: 303,
      headers,
    });
  },
};`;

export function FormsSection() {
  return (
    <PageSection id="forms-section">
      <SideBySide mdColSplit="2/3" lgColSplit="2/3" class="!items-start">
        <div class="flex flex-col gap-4 md:sticky md:top-4">
          <div
            role="img"
            alt="Arrows routing and crossing each other emoji"
            class="leading-none text-[4rem]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon icon-tabler icon-tabler-route-square-2 text-fresh"
              width="4rem"
              height="4rem"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M14 5a2 2 0 0 0 -2 2v10a2 2 0 0 1 -2 2" />
              <path d="M3 17h4v4h-4z" />
              <path d="M17 3h4v4h-4z" />
            </svg>
          </div>
          <SectionHeading>
            Forms, the right way
          </SectionHeading>
          <p>
            Don't fight the browser. Fresh helps you handle form submissions and
            other dynamic requests server-side, from any route.
          </p>
          <p>
            Since Fresh is built on{" "}
            <a href="https://deno.com" class="underline">Deno</a>, it's built on
            web standards.
          </p>
          <FancyLink href="/docs/concepts/forms" class="mt-2">
            Forms in Fresh
          </FancyLink>
        </div>
        <div class="flex flex-col gap-4">
          <CodeWindow name="routes/index.tsx">
            <CodeBlock
              code={routingCode}
              lang="jsx"
            />
          </CodeWindow>
          <ExampleArrow />
          <DemoBox>
            <FormSubmitDemo />
          </DemoBox>
        </div>
      </SideBySide>
    </PageSection>
  );
}